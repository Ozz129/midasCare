import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { BrandLogo } from '../brand/BrandLogo';
import { Dialog } from '../ui/Dialog';
import { SidebarNav } from './SidebarNav';

/**
 * Navegación en móvil/tablet (< 1024px): el mismo contenido del sidebar en un
 * panel lateral modal (foco atrapado, Escape y clic exterior cierran).
 */
export function MobileNavigation({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation();

  // Cierra el panel al cambiar de ruta.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Menú de navegación"
      hideTitle
      placement="left"
      tone="dark"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-header shrink-0 items-center justify-between border-b border-white/10 pr-3 pl-5">
          <BrandLogo tone="light" size="sm" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex size-control items-center justify-center rounded-control text-white/80 transition-interactive hover:bg-white/10 hover:text-white focus-ring-on-dark"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <SidebarNav onNavigate={onClose} />
      </div>
    </Dialog>
  );
}
