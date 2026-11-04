import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Registro de auditoría (solo inserción).
 * Sin claves foráneas a propósito: el rastro debe sobrevivir aunque cambien
 * o se eliminen los registros referenciados.
 */
@Entity({ name: 'audit_logs' })
@Index(['tenantId', 'occurredAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  tenantId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  actorUserId!: string | null;

  /** Acción en formato `dominio.verbo`, p. ej. `auth.login`, `files.upload`. */
  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 100 })
  resourceType!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resourceId!: string | null;

  /** Contexto adicional. NUNCA debe contener contraseñas, tokens ni contenido clínico. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  occurredAt!: Date;
}
