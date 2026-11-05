import { randomUUID } from 'node:crypto';
import { type Readable } from 'node:stream';
import { type MyProfileResponse } from '@care/api-contracts';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import { detectImageType } from '../../infrastructure/storage/image-type';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '../../infrastructure/storage/storage-provider';
import { AuditService } from '../audit/audit.service';
import {
  ProfessionalsService,
  toProfessionalProfileResponse,
} from '../professionals/professionals.service';
import { type User } from '../users/entities/user.entity';
import { toUserProfileResponse, UsersService } from '../users/users.service';
import { type UpdateMyProfileDto } from './dto/profile.dto';

export type ProfileImageKind = 'avatar' | 'signature';

const INVALID_IMAGE = 'Formato no permitido. Usa una imagen PNG, JPG o WebP.';

/**
 * Perfil del usuario autenticado: datos personales, perfil profesional, foto y firma.
 * Las imágenes se guardan en el almacenamiento PRIVADO (users/<id>/...) y solo las
 * obtiene su dueño a través de la API.
 */
@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly professionalsService: ProfessionalsService,
    private readonly auditService: AuditService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async getProfile(userId: string): Promise<MyProfileResponse> {
    const user = await this.requireUser(userId);
    const professional = await this.professionalsService.findProfileByUserId(userId);
    return {
      user: toUserProfileResponse(user),
      professional: professional ? toProfessionalProfileResponse(professional) : null,
    };
  }

  /**
   * Actualiza datos personales (User) y profesionales (ProfessionalProfile) como una
   * sola unidad: la lectura, ambas escrituras (incluida la creación del perfil si no
   * existía) y el registro de auditoría comparten una transacción. Si cualquier paso
   * falla, se revierte todo y el error se propaga; nunca queda un cambio parcial.
   */
  async update(userId: string, dto: UpdateMyProfileDto): Promise<MyProfileResponse> {
    await this.dataSource.transaction((manager) => this.applyUpdate(userId, dto, manager));
    // Se lee tras el COMMIT para devolver exactamente lo que quedó persistido.
    return this.getProfile(userId);
  }

  private async applyUpdate(
    userId: string,
    dto: UpdateMyProfileDto,
    manager: EntityManager,
  ): Promise<void> {
    const user = await this.requireUser(userId, manager);
    const changed: string[] = [];

    const userChanges: Partial<Pick<User, 'givenName' | 'familyName'>> = {};
    if (dto.givenName !== undefined && dto.givenName !== user.givenName) {
      userChanges.givenName = dto.givenName;
      changed.push('givenName');
    }
    if (dto.familyName !== undefined && dto.familyName !== user.familyName) {
      userChanges.familyName = dto.familyName;
      changed.push('familyName');
    }
    await this.usersService.update(userId, userChanges, manager);

    const touchesProfessional =
      dto.displayName !== undefined ||
      dto.licenseNumber !== undefined ||
      dto.specialties !== undefined;

    if (touchesProfessional) {
      const fullName = `${userChanges.givenName ?? user.givenName} ${userChanges.familyName ?? user.familyName}`;
      const profile = await this.professionalsService.getOrCreate(userId, fullName, manager);
      if (dto.displayName !== undefined) {
        profile.displayName = dto.displayName;
        changed.push('displayName');
      }
      if (dto.licenseNumber !== undefined) {
        profile.licenseNumber = dto.licenseNumber;
        changed.push('licenseNumber');
      }
      if (dto.specialties !== undefined) {
        profile.specialties = dto.specialties;
        changed.push('specialties');
      }
      await this.professionalsService.save(profile, manager);
    }

    if (changed.length > 0) {
      await this.auditService.record(
        {
          action: 'profile.update',
          resourceType: 'user',
          resourceId: userId,
          actorUserId: userId,
          // Solo los nombres de los campos, nunca sus valores.
          metadata: { fields: changed },
        },
        manager,
      );
    }
  }

  async setImage(
    kind: ProfileImageKind,
    userId: string,
    content: Buffer | undefined,
  ): Promise<MyProfileResponse> {
    if (!content || content.length === 0) {
      throw new BadRequestException('Selecciona una imagen.');
    }
    const mimeType = detectImageType(content);
    if (!mimeType) throw new BadRequestException(INVALID_IMAGE);

    const user = await this.requireUser(userId);
    const key = `users/${userId}/${kind}-${randomUUID()}`;
    await this.storage.put(key, content);

    let previousKey: string | null;
    try {
      if (kind === 'avatar') {
        previousKey = user.avatarStorageKey;
        await this.usersService.update(userId, {
          avatarStorageKey: key,
          avatarMimeType: mimeType,
          avatarUpdatedAt: new Date(),
        });
      } else {
        const profile = await this.professionalsService.getOrCreate(
          userId,
          `${user.givenName} ${user.familyName}`,
        );
        previousKey = profile.signatureStorageKey;
        profile.signatureStorageKey = key;
        profile.signatureMimeType = mimeType;
        profile.signatureUpdatedAt = new Date();
        await this.professionalsService.save(profile);
      }
    } catch (error) {
      // Evita archivos huérfanos si falla la persistencia de metadatos.
      await this.storage.delete(key);
      throw error;
    }

    await this.removeQuietly(previousKey);
    await this.auditService.record({
      action: `profile.${kind}_updated`,
      resourceType: kind === 'avatar' ? 'user' : 'professional_profile',
      resourceId: userId,
      actorUserId: userId,
      metadata: { mimeType, sizeBytes: content.length },
    });
    return this.getProfile(userId);
  }

  async getImage(
    kind: ProfileImageKind,
    userId: string,
  ): Promise<{ stream: Readable; mimeType: string }> {
    const { key, mimeType } = await this.currentImage(kind, userId);
    if (!key || !mimeType) throw new NotFoundException('Imagen no encontrada.');
    return { stream: await this.storage.createReadStream(key), mimeType };
  }

  async deleteImage(kind: ProfileImageKind, userId: string): Promise<MyProfileResponse> {
    const { key } = await this.currentImage(kind, userId);
    if (key) {
      if (kind === 'avatar') {
        await this.usersService.update(userId, {
          avatarStorageKey: null,
          avatarMimeType: null,
          avatarUpdatedAt: null,
        });
      } else {
        const profile = await this.professionalsService.findProfileByUserId(userId);
        if (profile) {
          profile.signatureStorageKey = null;
          profile.signatureMimeType = null;
          profile.signatureUpdatedAt = null;
          await this.professionalsService.save(profile);
        }
      }
      await this.removeQuietly(key);
      await this.auditService.record({
        action: `profile.${kind}_deleted`,
        resourceType: kind === 'avatar' ? 'user' : 'professional_profile',
        resourceId: userId,
        actorUserId: userId,
      });
    }
    return this.getProfile(userId);
  }

  private async currentImage(
    kind: ProfileImageKind,
    userId: string,
  ): Promise<{ key: string | null; mimeType: string | null }> {
    if (kind === 'avatar') {
      const user = await this.requireUser(userId);
      return { key: user.avatarStorageKey, mimeType: user.avatarMimeType };
    }
    const profile = await this.professionalsService.findProfileByUserId(userId);
    return {
      key: profile?.signatureStorageKey ?? null,
      mimeType: profile?.signatureMimeType ?? null,
    };
  }

  private async requireUser(userId: string, manager?: EntityManager): Promise<User> {
    const user = await this.usersService.findById(userId, manager);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async removeQuietly(key: string | null): Promise<void> {
    if (!key) return;
    try {
      await this.storage.delete(key);
    } catch (error) {
      this.logger.warn(
        `No se pudo eliminar un archivo de perfil anterior: ${(error as Error).name}`,
      );
    }
  }
}
