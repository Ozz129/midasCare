import { type MembershipRole } from '@care/api-contracts';
import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ROLES_KEY = 'access-control:required-roles';

/**
 * Restringe un endpoint a ciertos roles de membresía dentro del tenant activo.
 * Debe usarse junto con TenantAccessGuard.
 */
export const RequireRoles = (...roles: MembershipRole[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);
