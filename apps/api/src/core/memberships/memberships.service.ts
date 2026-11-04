import { Injectable } from '@nestjs/common';
import { type Membership } from './entities/membership.entity';
import { MembershipsRepository } from './memberships.repository';

@Injectable()
export class MembershipsService {
  constructor(private readonly membershipsRepository: MembershipsRepository) {}

  /** Devuelve la membresía ACTIVA del usuario en el tenant, o `null` si no existe. */
  findActiveMembership(userId: string, tenantId: string): Promise<Membership | null> {
    return this.membershipsRepository.findActive(userId, tenantId);
  }

  listActiveMemberships(userId: string): Promise<Membership[]> {
    return this.membershipsRepository.listActiveForUser(userId);
  }
}
