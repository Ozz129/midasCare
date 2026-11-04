/*
 * Contratos de tenants (organizaciones y espacios de profesionales independientes).
 * ESTADO:
 *   GET   /api/v1/tenants      -> UserTenantResponse[]  (implementado)
 *   GET   /api/v1/tenants/:id  -> previsto
 *   PATCH /api/v1/tenants/:id  -> previsto
 */
import type { IsoDateTimeString, Uuid, ValueOf } from '@care/shared-types';
import type { MembershipRole } from './memberships.js';

export const TenantType = {
  /** Espacio de un profesional independiente. */
  INDIVIDUAL: 'INDIVIDUAL',
  /** Clínica u organización con múltiples profesionales. */
  ORGANIZATION: 'ORGANIZATION',
} as const;
export type TenantType = ValueOf<typeof TenantType>;

export const TenantStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type TenantStatus = ValueOf<typeof TenantStatus>;

export interface TenantResponse {
  id: Uuid;
  type: TenantType;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: IsoDateTimeString;
}

/** Tenant al que pertenece el usuario autenticado, con su rol en él. */
export interface UserTenantResponse {
  tenant: TenantResponse;
  membershipId: Uuid;
  role: MembershipRole;
}

export interface UpdateTenantRequest {
  name?: string;
}
