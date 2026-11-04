import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../infrastructure/database/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Sesión de autenticación (una por dispositivo / inicio de sesión).
 * Guarda solo el SHA-256 del refresh token vigente; cada renovación lo rota.
 */
@Entity({ name: 'auth_sessions' })
@Unique(['tokenHash'])
export class AuthSession extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'char', length: 64 })
  tokenHash!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
