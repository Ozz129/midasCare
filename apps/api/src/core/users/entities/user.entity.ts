import { UserStatus } from '@care/api-contracts';
import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../../../infrastructure/database/base.entity';

/**
 * Identidad global de una persona en la plataforma.
 * No contiene datos profesionales (ver ProfessionalProfile) ni pertenencia a tenants (ver Membership).
 */
@Entity({ name: 'users' })
@Unique(['email'])
export class User extends BaseEntity {
  /** Siempre normalizado (minúsculas, sin espacios). */
  @Column({ type: 'varchar', length: 320 })
  email!: string;

  /** Hash de la contraseña. Nunca se selecciona por defecto ni se expone en respuestas. */
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100 })
  givenName!: string;

  @Column({ type: 'varchar', length: 100 })
  familyName!: string;

  @Column({ type: 'varchar', length: 32, default: UserStatus.PENDING_VERIFICATION })
  status!: UserStatus;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  /** Clave interna de la foto de perfil en el StorageProvider. Nunca se expone. */
  @Column({ type: 'varchar', length: 512, nullable: true })
  avatarStorageKey!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  avatarMimeType!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  avatarUpdatedAt!: Date | null;
}
