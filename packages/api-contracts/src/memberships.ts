/*
 * Contratos de membresías (vínculo usuario ↔ tenant).
 * Los roles son PROVISIONALES y se revisarán al implementar el control de acceso.
 */
import type { Uuid, ValueOf } from '@care/shared-types';

export const MembershipRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  PROFESSIONAL: 'PROFESSIONAL',
  STAFF: 'STAFF',
} as const;
export type MembershipRole = ValueOf<typeof MembershipRole>;

export const MembershipStatus = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  REVOKED: 'REVOKED',
} as const;
export type MembershipStatus = ValueOf<typeof MembershipStatus>;

export interface MembershipResponse {
  id: Uuid;
  tenantId: Uuid;
  userId: Uuid;
  role: MembershipRole;
  status: MembershipStatus;
}
