import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type DeepPartial, type EntityManager, Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditRepository {
  constructor(@InjectRepository(AuditLog) private readonly repository: Repository<AuditLog>) {}

  /** Solo inserción: la auditoría no se actualiza ni se elimina desde la aplicación. */
  async insert(entry: DeepPartial<AuditLog>, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(AuditLog) : this.repository;
    await repository.save(repository.create(entry));
  }
}
