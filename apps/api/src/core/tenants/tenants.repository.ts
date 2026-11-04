import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsRepository {
  constructor(@InjectRepository(Tenant) private readonly repository: Repository<Tenant>) {}

  findById(id: string): Promise<Tenant | null> {
    return this.repository.findOneBy({ id });
  }
}
