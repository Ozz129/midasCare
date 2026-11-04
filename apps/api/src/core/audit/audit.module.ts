import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';

/** Trazabilidad de operaciones relevantes. Sin CRUD público. */
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditRepository, AuditService],
  exports: [AuditService],
})
export class AuditModule {}
