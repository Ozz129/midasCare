import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { Tenant } from './entities/tenant.entity';
import { TenantsController } from './tenants.controller';
import { TenantsRepository } from './tenants.repository';
import { TenantsService } from './tenants.service';

/**
 * Organizaciones y espacios de profesionales independientes (INDIVIDUAL | ORGANIZATION).
 * Implementado: GET /tenants. Previstos: GET/PATCH /tenants/:id.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), AuthModule, MembershipsModule],
  controllers: [TenantsController],
  providers: [TenantsRepository, TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
