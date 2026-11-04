import { Palette } from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '../../utils/cn';
import { webEnv } from '../../utils/env';
import { type NavigationItem, primaryNavigation, secondaryNavigation } from './navigation';

function NavEntry({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  const base =
    'group flex min-h-11 items-center gap-3 rounded-control px-3 text-label font-medium transition-interactive';

  if (!item.to) {
    return (
      <span
        aria-disabled="true"
        className={cn(base, 'cursor-not-allowed text-white/60')}
        title="Disponible próximamente"
      >
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        <span className="flex-1">{item.label}</span>
        <span className="rounded-pill border border-white/20 px-2 py-0.5 text-caption text-white/70">
          Pronto
        </span>
      </span>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          base,
          'relative focus-ring-on-dark',
          isActive
            ? 'bg-white/10 text-white before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-pill before:bg-primary-on-dark'
            : 'text-white/80 hover:bg-white/5 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'size-5 shrink-0',
              isActive ? 'text-primary-on-dark' : 'text-white/70 group-hover:text-white',
            )}
            aria-hidden="true"
          />
          <span className="flex-1">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

/** Contenido de navegación compartido por el sidebar (escritorio) y el drawer (móvil). */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Principal" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      <div>
        <p className="px-3 pb-2 text-caption font-semibold tracking-wider text-white/60 uppercase">
          Clínica
        </p>
        <ul className="flex flex-col gap-1">
          {primaryNavigation.map((item) => (
            <li key={item.id}>
              <NavEntry item={item} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="px-3 pb-2 text-caption font-semibold tracking-wider text-white/60 uppercase">
          Cuenta
        </p>
        <ul className="flex flex-col gap-1">
          {secondaryNavigation.map((item) => (
            <li key={item.id}>
              <NavEntry item={item} onNavigate={onNavigate} />
            </li>
          ))}
          {import.meta.env.DEV && (
            <li>
              <NavEntry
                item={{
                  id: 'ds',
                  label: 'Guía de componentes',
                  icon: Palette,
                  to: '/design-system',
                }}
                onNavigate={onNavigate}
              />
            </li>
          )}
        </ul>
      </div>
      <p className="mt-auto px-3 text-caption text-white/60">
        Entorno: <span className="font-medium text-white/80">{webEnv.appEnv}</span>
      </p>
    </nav>
  );
}
