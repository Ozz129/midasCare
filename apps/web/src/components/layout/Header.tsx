import { Building2, ChevronRight, LogOut, Menu, Settings, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useRouteMeta } from '../../app/router/route-meta';
import { useSession } from '../../features/auth/session';
import { signOut } from '../../features/auth/session-store';
import { useProfileImageUrl } from '../../features/profile/useProfile';
import { roleLabels, useUserTenants } from '../../features/tenants/useUserTenants';
import { BrandLogo } from '../brand/BrandLogo';
import { Avatar } from '../ui/Avatar';
import { DropdownMenu } from '../ui/DropdownMenu';
import { Skeleton } from '../ui/Skeleton';

/** Espacio de trabajo activo (por ahora, el primero del usuario). */
function ActiveWorkspace() {
  const { data, isPending, isError } = useUserTenants();
  const active = data?.[0];

  if (isPending) return <Skeleton className="hidden h-control-sm w-40 sm:block" />;
  if (isError || !active) return null;

  return (
    <span className="hidden h-control-sm max-w-80 items-center gap-2 rounded-control border border-border bg-surface px-3 text-label sm:inline-flex">
      <Building2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="sr-only">Espacio de trabajo:</span>
      <span className="truncate font-medium text-text">{active.tenant.name}</span>
      <span className="shrink-0 text-caption text-muted">· {roleLabels[active.role]}</span>
    </span>
  );
}

/** Encabezado superior: título contextual, migas, espacio activo y menú de usuario. */
export function Header({ onOpenNavigation }: { onOpenNavigation: () => void }) {
  const { title, breadcrumbs } = useRouteMeta();
  const session = useSession();
  const navigate = useNavigate();
  const user = session.status === 'authenticated' ? session.user : null;
  const fullName = user ? `${user.givenName} ${user.familyName}` : undefined;
  const avatarUrl = useProfileImageUrl('avatar', user?.hasAvatar ? user.avatarUpdatedAt : null);

  return (
    <header className="sticky top-0 z-10 flex h-header shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenNavigation}
        aria-label="Abrir menú de navegación"
        className="-ml-2 flex size-control items-center justify-center rounded-control text-text transition-interactive hover:bg-surface-muted focus-ring lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <Link
        to="/"
        className="rounded-control focus-ring sm:hidden"
        aria-label="MIDAS CARE, ir al panel"
      >
        <BrandLogo variant="compact" size="sm" />
      </Link>

      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Migas de pan" className="hidden sm:block">
            <ol className="flex items-center gap-1 text-caption text-muted">
              {breadcrumbs.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-1">
                  {crumb.to ? (
                    <Link to={crumb.to} className="rounded hover:text-primary focus-ring">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                  <ChevronRight className="size-3" aria-hidden="true" />
                </li>
              ))}
              <li aria-current="page" className="font-medium text-text">
                {title}
              </li>
            </ol>
          </nav>
        )}
        <p className="truncate text-card-title font-semibold text-navy">{title}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ActiveWorkspace />

        <DropdownMenu
          label="Menú de usuario"
          trigger={<Avatar size="sm" name={fullName} src={avatarUrl} />}
          header={
            user && (
              <div className="min-w-0">
                <p className="truncate text-label font-semibold text-navy">{fullName}</p>
                <p className="truncate text-caption text-muted">{user.email}</p>
              </div>
            )
          }
          items={[
            {
              id: 'profile',
              label: 'Mi perfil',
              icon: <UserRound aria-hidden="true" />,
              to: '/profile',
            },
            {
              id: 'settings',
              label: 'Configuración',
              icon: <Settings aria-hidden="true" />,
              to: '/settings',
            },
            {
              id: 'logout',
              label: 'Cerrar sesión',
              icon: <LogOut aria-hidden="true" />,
              onSelect: () => {
                void signOut().finally(() => navigate('/login', { replace: true }));
              },
            },
          ]}
        />
      </div>
    </header>
  );
}
