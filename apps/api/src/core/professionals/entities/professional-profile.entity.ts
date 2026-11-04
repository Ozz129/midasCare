import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../infrastructure/database/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Perfil profesional de un usuario (separado de su identidad global).
 * La relación con organizaciones se expresa mediante Membership (rol PROFESSIONAL).
 */
@Entity({ name: 'professional_profiles' })
@Unique(['userId'])
export class ProfessionalProfile extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  displayName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  licenseNumber!: string | null;

  /** Códigos de especialidad (p. ej. PSYCHOLOGY). Extensible sin cambios de esquema. */
  @Column({ type: 'text', array: true, default: () => "'{}'" })
  specialties!: string[];

  /**
   * Firma digitalizada (imagen) en el StorageProvider. Dato sensible: solo la
   * obtiene su dueño. Su uso en documentos clínicos lo controlará el módulo de firmas.
   */
  @Column({ type: 'varchar', length: 512, nullable: true })
  signatureStorageKey!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  signatureMimeType!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  signatureUpdatedAt!: Date | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
