import { Column, CreateDateColumn, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Columnas comunes: UUID como clave primaria y marcas de tiempo TIMESTAMPTZ. */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

/**
 * Base para entidades de negocio pertenecientes a un tenant.
 * Toda consulta sobre estas entidades DEBE filtrar por `tenantId`
 * obtenido del contexto de tenant validado (nunca directamente del cliente).
 */
export abstract class TenantScopedEntity extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;
}
