import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { AuthSession } from './entities/auth-session.entity';

@Injectable()
export class AuthSessionsRepository {
  constructor(
    @InjectRepository(AuthSession) private readonly repository: Repository<AuthSession>,
  ) {}

  create(data: Partial<AuthSession>): Promise<AuthSession> {
    return this.repository.save(this.repository.create(data));
  }

  /** Sesión vigente (no revocada ni expirada) para el hash de refresh token dado. */
  findActiveByTokenHash(tokenHash: string): Promise<AuthSession | null> {
    return this.repository.findOneBy({
      tokenHash,
      revokedAt: IsNull(),
      expiresAt: MoreThan(new Date()),
    });
  }

  /**
   * Rota el refresh token de forma atómica: solo actualiza si el hash anterior
   * sigue vigente. Devuelve false si otra petición ya lo rotó o revocó.
   */
  async rotate(
    sessionId: string,
    previousHash: string,
    next: { tokenHash: string; expiresAt: Date },
  ): Promise<boolean> {
    const result = await this.repository.update(
      { id: sessionId, tokenHash: previousHash, revokedAt: IsNull() },
      { tokenHash: next.tokenHash, expiresAt: next.expiresAt, lastUsedAt: new Date() },
    );
    return (result.affected ?? 0) === 1;
  }

  async revokeByTokenHash(tokenHash: string): Promise<AuthSession | null> {
    const session = await this.repository.findOneBy({ tokenHash, revokedAt: IsNull() });
    if (!session) return null;
    await this.repository.update({ id: session.id }, { revokedAt: new Date() });
    return session;
  }

  async revoke(sessionId: string): Promise<void> {
    await this.repository.update({ id: sessionId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}
