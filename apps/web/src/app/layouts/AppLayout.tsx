import { useCallback, useState } from 'react';
import { Outlet } from 'react-router';
import { Header } from '../../components/layout/Header';
import { MobileNavigation } from '../../components/layout/MobileNavigation';
import { Sidebar } from '../../components/layout/Sidebar';

export function AppLayout() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const closeNavigation = useCallback(() => setNavigationOpen(false), []);

  return (
    <div className="min-h-full">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-control bg-surface px-4 py-2 text-label font-medium text-primary shadow-raised focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>

      <Sidebar />
      <MobileNavigation open={navigationOpen} onClose={closeNavigation} />

      <div className="flex min-h-full flex-col lg:pl-sidebar">
        <Header onOpenNavigation={() => setNavigationOpen(true)} />
        <main
          id="contenido"
          tabIndex={-1}
          className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <div className="mx-auto w-full max-w-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
