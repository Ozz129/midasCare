import { MembershipStatus, TenantStatus } from '@care/api-contracts';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from './entities/membership.entity';

@Injectable()
export class MembershipsRepository {
  constructor(@InjectRepository(Membership) private readonly repository: Repository<Membership>) {}

  findActive(userId: string, tenantId: string): Promise<Membership | null> {
    return this.repository.findOneBy({ userId, tenantId, status: MembershipStatus.ACTIVE });
  }

  /** Membresías activas del usuario en tenants activos, con el tenant cargado. */
  listActiveForUser(userId: string): Promise<Membership[]> {
    return this.repository.find({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        tenant: { status: TenantStatus.ACTIVE },
      },
      relations: { tenant: true },
      order: { createdAt: 'ASC' },
    });
  }
}
