import { Module } from '@nestjs/common';
import { MembershipsModule } from '../memberships/memberships.module';
import { TenantAccessGuard } from './guards/tenant-access.guard';

/**
 * RBAC básico y autorización por tenant.
 * Uso previsto en controladores de negocio:
 *
 *   @UseGuards(AuthGuard, TenantAccessGuard)   // AuthGuard lo aportará AuthModule
 *   @RequireRoles(MembershipRole.PROFESSIONAL)
 *   handler(@CurrentTenant() tenant: TenantContext) { ... }
 *
 * La autorización clínica específica (p. ej. acceso a una historia concreta)
 * se implementará como policies dentro de cada módulo clínico.
 */
@Module({
  imports: [MembershipsModule],
  providers: [TenantAccessGuard],
  exports: [TenantAccessGuard, MembershipsModule],
})
export class AccessControlModule {}
