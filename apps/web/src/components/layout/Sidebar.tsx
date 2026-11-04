import { Link } from 'react-router';
import { BrandLogo } from '../brand/BrandLogo';
import { SidebarNav } from './SidebarNav';

/** Sidebar fijo de escritorio (>= 1024px). En móvil se usa MobileNavigation. */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-sidebar flex-col bg-navy lg:flex">
      <div className="flex h-header shrink-0 items-center border-b border-white/10 px-6">
        <Link
          to="/"
          className="rounded-control focus-ring-on-dark"
          aria-label="MIDAS CARE, ir al panel"
        >
          <BrandLogo tone="light" />
        </Link>
      </div>
      <SidebarNav />
      {/* Filete dorado: acento de marca MIDAS, puramente decorativo. */}
      <div className="h-1 shrink-0 bg-gold/70" aria-hidden="true" />
    </aside>
  );
}
