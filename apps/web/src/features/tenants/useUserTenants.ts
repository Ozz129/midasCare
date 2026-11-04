import { MembershipRole } from '@care/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '../../services/api';
import { useSession } from '../auth/session';

/** Espacios de trabajo del usuario autenticado (GET /api/v1/tenants). */
export function useUserTenants() {
  const session = useSession();
  return useQuery({
    queryKey: ['tenants', 'mine'],
    queryFn: ({ signal }) => tenantsApi.listMine(signal),
    enabled: session.status === 'authenticated',
    staleTime: 5 * 60_000,
  });
}

export const roleLabels: Record<MembershipRole, string> = {
  [MembershipRole.OWNER]: 'Propietario',
  [MembershipRole.ADMIN]: 'Administrador',
  [MembershipRole.PROFESSIONAL]: 'Profesional',
  [MembershipRole.STAFF]: 'Personal',
};
