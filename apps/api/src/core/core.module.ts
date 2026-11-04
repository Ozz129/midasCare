import { Module } from '@nestjs/common';
import { AccessControlModule } from './access-control/access-control.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { MembershipsModule } from './memberships/memberships.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { ProfileModule } from './profile/profile.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';

/**
 * Módulos Core transversales. Pueden ser importados por cualquier módulo de
 * negocio (src/modules/*), pero NUNCA dependen de módulos clínicos.
 * Cada módulo de negocio importa directamente los módulos Core que necesita.
 */
@Module({
  imports: [
    AuthModule,
    UsersModule,
    TenantsModule,
    MembershipsModule,
    AccessControlModule,
    ProfessionalsModule,
    FilesModule,
    AuditModule,
    ProfileModule,
  ],
})
export class CoreModule {}
