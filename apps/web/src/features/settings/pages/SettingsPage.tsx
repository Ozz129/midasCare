import { Building2, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { buttonClassName } from '../../../components/ui/button-styles';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useSession } from '../../auth/session';
import { useProfileImageUrl } from '../../profile/useProfile';
import { roleLabels, useUserTenants } from '../../tenants/useUserTenants';

const tenantTypeLabels = { INDIVIDUAL: 'Profesional independiente', ORGANIZATION: 'Organización' };

/** Configuración de cuenta y espacios de trabajo (solo lectura por ahora). */
export function SettingsPage() {
  useDocumentTitle('Configuración');
  const session = useSession();
  const tenants = useUserTenants();
  const user = session.status === 'authenticated' ? session.user : null;
  const avatarUrl = useProfileImageUrl('avatar', user?.hasAvatar ? user.avatarUpdatedAt : null);

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Tu perfil y tus espacios de trabajo." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={<UserRound />}
            title="Perfil"
            action={
              <Link to="/profile" className={buttonClassName({ variant: 'secondary', size: 'sm' })}>
                Editar perfil
              </Link>
            }
          />
          {user && (
            <div className="flex items-center gap-4">
              <Avatar size="lg" name={`${user.givenName} ${user.familyName}`} src={avatarUrl} />
              <dl className="min-w-0 text-label">
                <dt className="sr-only">Nombre</dt>
                <dd className="truncate text-card-title font-semibold text-navy">
                  {user.givenName} {user.familyName}
                </dd>
                <dt className="sr-only">Correo electrónico</dt>
                <dd className="truncate text-muted">{user.email}</dd>
              </dl>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader icon={<Building2 />} title="Espacios de trabajo" />
          {tenants.isPending ? (
            <Skeleton className="h-14 w-full" />
          ) : tenants.isError ? (
            <p className="text-label text-danger">No se pudieron cargar tus espacios de trabajo.</p>
          ) : (
            <ul className="divide-y divide-border">
              {tenants.data.map(({ tenant, role, membershipId }) => (
                <li key={membershipId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-label font-semibold text-text">{tenant.name}</p>
                    <p className="text-caption text-muted">{tenantTypeLabels[tenant.type]}</p>
                  </div>
                  <Badge tone="primary">{roleLabels[role]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
