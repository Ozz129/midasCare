import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';
import { cn } from '../../utils/cn';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Título accesible (obligatorio). */
  title: ReactNode;
  description?: ReactNode;
  hideTitle?: boolean;
  /** `center`: modal clásico. `left`: panel lateral (navegación móvil). */
  placement?: 'center' | 'left';
  size?: 'sm' | 'md' | 'lg';
  /** Superficie del panel: `light` (blanco) o `dark` (azul profundo, p. ej. navegación). */
  tone?: 'light' | 'dark';
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

/**
 * Modal accesible sobre el elemento nativo <dialog>: el navegador gestiona el
 * atrapado de foco, la tecla Escape, el "inert" del resto de la página y la
 * devolución del foco al cerrar. Clic en el fondo también cierra.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  hideTitle,
  placement = 'center',
  size = 'md',
  tone = 'light',
  footer,
  className,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Evita el scroll de la página bajo el modal.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        'border-0 bg-transparent p-0 text-text open:animate-fade-in',
        placement === 'center' && cn('m-auto w-[calc(100%-2rem)]', widths[size]),
        placement === 'left' &&
          'm-0 h-dvh max-h-dvh w-[min(20rem,85vw)] max-w-none open:animate-slide-in-left',
      )}
    >
      <div
        className={cn(
          'flex flex-col shadow-overlay',
          tone === 'light' ? 'bg-surface' : 'bg-navy',
          placement === 'center' && 'max-h-[85dvh] rounded-dialog',
          placement === 'left' && 'h-full',
          className,
        )}
      >
        {hideTitle ? (
          // El contenido aporta su propio encabezado y botón de cierre.
          <div className="sr-only">
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
            <div>
              <h2 id={titleId} className="text-section-title font-semibold text-navy">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-label text-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mt-1 -mr-2 flex size-control-sm items-center justify-center rounded-control text-muted transition-interactive hover:bg-surface-muted hover:text-text focus-ring"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className={cn('flex-1 overflow-y-auto', !hideTitle && 'px-5 py-4 sm:px-6')}>
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
