import { TenantStatus, type TenantType } from '@care/api-contracts';
import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from '../../../infrastructure/database/base.entity';

/**
 * Unidad de aislamiento de datos: una organización (clínica) o el espacio
 * de un profesional independiente.
 */
@Entity({ name: 'tenants' })
@Unique(['slug'])
export class Tenant extends BaseEntity {
  @Column({ type: 'varchar', length: 32 })
  type!: TenantType;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  slug!: string;

  @Column({ type: 'varchar', length: 32, default: TenantStatus.ACTIVE })
  status!: TenantStatus;

  /** Configuración no sensible del tenant (preferencias, personalización). */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  settings!: Record<string, unknown>;
}
