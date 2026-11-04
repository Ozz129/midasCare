import { Injectable } from '@nestjs/common';
import { type Tenant } from './entities/tenant.entity';
import { TenantsRepository } from './tenants.repository';

@Injectable()
export class TenantsService {
  constructor(private readonly tenantsRepository: TenantsRepository) {}

  findById(id: string): Promise<Tenant | null> {
    return this.tenantsRepository.findById(id);
  }
}
