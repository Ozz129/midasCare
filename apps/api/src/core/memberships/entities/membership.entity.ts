import { type MembershipRole, MembershipStatus } from '@care/api-contracts';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { TenantScopedEntity } from '../../../infrastructure/database/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';

/** Vínculo de un usuario con un tenant, con su rol y estado dentro de ese tenant. */
@Entity({ name: 'memberships' })
@Unique(['tenantId', 'userId'])
export class Membership extends TenantScopedEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 32 })
  role!: MembershipRole;

  @Column({ type: 'varchar', length: 32, default: MembershipStatus.INVITED })
  status!: MembershipStatus;

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
