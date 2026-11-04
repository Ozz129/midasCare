import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { TenantScopedEntity } from '../../../infrastructure/database/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';

/** Metadatos de un archivo privado. El contenido vive en el StorageProvider. */
@Entity({ name: 'stored_files' })
@Unique(['storageKey'])
export class StoredFile extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 32 })
  storageDriver!: string;

  /** Clave opaca generada por el backend. */
  @Column({ type: 'varchar', length: 512 })
  storageKey!: string;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 255 })
  mimeType!: string;

  /** BIGINT: TypeORM lo devuelve como string para no perder precisión. */
  @Column({ type: 'bigint' })
  sizeBytes!: string;

  @Column({ type: 'char', length: 64 })
  checksumSha256!: string;

  @Column({ type: 'uuid', nullable: true })
  uploadedByUserId!: string | null;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploaded_by_user_id' })
  uploadedBy?: User | null;
}
