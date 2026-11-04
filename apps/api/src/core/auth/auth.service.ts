import { randomBytes } from 'node:crypto';
import {
  type AuthSessionResponse,
  MembershipRole,
  MembershipStatus,
  TenantStatus,
  TenantType,
  type UserProfileResponse,
  UserStatus,
} from '@care/api-contracts';
import { normalizeEmail } from '@care/shared-utils';
import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource, QueryFailedError } from 'typeorm';
import { APP_CONFIG } from '../../config/app-config.module';
import { type AppConfig } from '../../config/environment';
import { AuditService } from '../audit/audit.service';
import { Membership } from '../memberships/entities/membership.entity';
import { ProfessionalProfile } from '../professionals/entities/professional-profile.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { toUserProfileResponse, UsersService } from '../users/users.service';
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  type AccessTokenPayload,
  generateRefreshToken,
  hashRefreshToken,
} from './auth.constants';
import { AuthSessionsRepository } from './auth-sessions.repository';
import { type LoginDto, type RegisterDto } from './dto/auth.dto';
import { PasswordHasher } from './password-hasher';

export interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

/** Resultado interno: la respuesta pública + el refresh token para la cookie. */
export interface IssuedSession {
  response: AuthSessionResponse;
  refreshToken: string;
  refreshExpiresAt: Date;
}

const INVALID_CREDENTIALS = 'Correo o contraseña incorrectos.';
const UNIQUE_VIOLATION = '23505';

function slugify(value: string): string {
  const base = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'espacio'}-${randomBytes(3).toString('hex')}`;
}

@Injectable()
export class AuthService {
  /** Hash de referencia para igualar tiempos cuando el usuario no existe. */
  private dummyHash: Promise<string> | undefined;

  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly sessions: AuthSessionsRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /**
   * Alta de un profesional independiente: crea el usuario, su espacio de trabajo
   * (tenant INDIVIDUAL) y su membresía OWNER en una única transacción.
   */
  async register(dto: RegisterDto, meta: RequestMetadata): Promise<IssuedSession> {
    const email = normalizeEmail(dto.email);
    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const workspaceName = dto.workspaceName ?? `${dto.givenName} ${dto.familyName}`;

    let user: User;
    try {
      user = await this.dataSource.transaction(async (manager) => {
        const created = await manager.save(
          manager.create(User, {
            email,
            passwordHash,
            givenName: dto.givenName,
            familyName: dto.familyName,
            // Sin verificación de correo todavía: la cuenta queda activa.
            status: UserStatus.ACTIVE,
          }),
        );
        const tenant = await manager.save(
          manager.create(Tenant, {
            type: TenantType.INDIVIDUAL,
            name: workspaceName,
            slug: slugify(workspaceName),
            status: TenantStatus.ACTIVE,
          }),
        );
        await manager.save(
          manager.create(Membership, {
            tenantId: tenant.id,
            userId: created.id,
            role: MembershipRole.OWNER,
            status: MembershipStatus.ACTIVE,
          }),
        );
        await manager.save(
          manager.create(ProfessionalProfile, {
            userId: created.id,
            displayName: `${dto.givenName} ${dto.familyName}`,
            licenseNumber: dto.licenseNumber ?? null,
            specialties: dto.specialty ? [dto.specialty] : [],
          }),
        );
        return created;
      });
    } catch (error) {
      // Carrera entre dos registros con el mismo correo.
      if (
        error instanceof QueryFailedError &&
        (error as { code?: string }).code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException('Ya existe una cuenta con ese correo.');
      }
      throw error;
    }

    await this.auditService.record({
      action: 'auth.register',
      resourceType: 'user',
      resourceId: user.id,
      actorUserId: user.id,
      ...meta,
    });
    return this.issueSession(user, meta);
  }

  async login(dto: LoginDto, meta: RequestMetadata): Promise<IssuedSession> {
    const email = normalizeEmail(dto.email);
    const user = await this.usersService.findByEmailWithPassword(email);

    // Siempre se calcula un hash para no revelar por tiempo si el correo existe.
    const valid = user
      ? await this.passwordHasher.verify(dto.password, user.passwordHash)
      : await this.passwordHasher.verify(dto.password, await this.getDummyHash()).then(() => false);

    if (!user || !valid || user.status !== UserStatus.ACTIVE) {
      await this.auditService.record({
        action: 'auth.login_failed',
        resourceType: 'user',
        resourceId: user?.id ?? null,
        actorUserId: null,
        // Nunca se registra la contraseña.
        metadata: { email, reason: !user ? 'unknown_user' : !valid ? 'bad_password' : 'inactive' },
        ...meta,
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.usersService.markLogin(user.id);
    await this.auditService.record({
      action: 'auth.login',
      resourceType: 'user',
      resourceId: user.id,
      actorUserId: user.id,
      ...meta,
    });
    return this.issueSession(user, meta);
  }

  /** Valida el refresh token, lo rota y emite un nuevo access token. */
  async refresh(refreshToken: string | undefined): Promise<IssuedSession> {
    if (!refreshToken) throw new UnauthorizedException();

    const previousHash = hashRefreshToken(refreshToken);
    const session = await this.sessions.findActiveByTokenHash(previousHash);
    if (!session) throw new UnauthorizedException();

    const user = await this.usersService.findById(session.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.sessions.revoke(session.id);
      throw new UnauthorizedException();
    }

    const nextToken = generateRefreshToken();
    const refreshExpiresAt = this.refreshExpiry();
    const rotated = await this.sessions.rotate(session.id, previousHash, {
      tokenHash: hashRefreshToken(nextToken),
      expiresAt: refreshExpiresAt,
    });
    if (!rotated) throw new UnauthorizedException();

    return {
      response: this.sessionResponse(user, session.id),
      refreshToken: nextToken,
      refreshExpiresAt,
    };
  }

  async logout(refreshToken: string | undefined, meta: RequestMetadata): Promise<void> {
    if (!refreshToken) return;
    const session = await this.sessions.revokeByTokenHash(hashRefreshToken(refreshToken));
    if (session) {
      await this.auditService.record({
        action: 'auth.logout',
        resourceType: 'auth_session',
        resourceId: session.id,
        actorUserId: session.userId,
        ...meta,
      });
    }
  }

  async me(userId: string): Promise<UserProfileResponse> {
    const user = await this.usersService.findById(userId);
    if (!user || user.status !== UserStatus.ACTIVE) throw new UnauthorizedException();
    return toUserProfileResponse(user);
  }

  private async issueSession(user: User, meta: RequestMetadata): Promise<IssuedSession> {
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = this.refreshExpiry();
    const session = await this.sessions.create({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshExpiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent?.slice(0, 512) ?? null,
    });
    return { response: this.sessionResponse(user, session.id), refreshToken, refreshExpiresAt };
  }

  private sessionResponse(user: User, sessionId: string): AuthSessionResponse {
    const payload: AccessTokenPayload = { sub: user.id, email: user.email, sid: sessionId };
    return {
      accessToken: this.jwtService.sign(payload, {
        algorithm: 'HS256',
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
        expiresIn: this.config.auth.accessTokenTtlSeconds,
      }),
      expiresIn: this.config.auth.accessTokenTtlSeconds,
      user: toUserProfileResponse(user),
    };
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.config.auth.refreshTokenTtlSeconds * 1000);
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.passwordHasher.hash(randomBytes(16).toString('hex'));
    return this.dummyHash;
  }
}
