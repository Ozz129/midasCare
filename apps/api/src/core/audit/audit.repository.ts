import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type DeepPartial, Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditRepository {
  constructor(@InjectRepository(AuditLog) private readonly repository: Repository<AuditLog>) {}

  /** Solo inserción: la auditoría no se actualiza ni se elimina desde la aplicación. */
  async insert(entry: DeepPartial<AuditLog>): Promise<void> {
    await this.repository.save(this.repository.create(entry));
  }
}
