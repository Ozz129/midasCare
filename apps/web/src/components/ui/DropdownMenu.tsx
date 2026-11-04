import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { cn } from '../../utils/cn';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Navega a una ruta interna. */
  to?: string;
  onSelect?: () => void;
  disabled?: boolean;
  /** Texto auxiliar (p. ej. por qué está deshabilitado). */
  description?: string;
}

export interface DropdownMenuProps {
  /** Nombre accesible del botón disparador. */
  label: string;
  trigger: ReactNode;
  items: DropdownMenuItem[];
  /** Contenido informativo no interactivo sobre los elementos. */
  header?: ReactNode;
  align?: 'start' | 'end';
  triggerClassName?: string;
}

/**
 * Menú desplegable con patrón ARIA "menu button":
 * Enter/Espacio/↓ abre · ↑/↓/Inicio/Fin navegan · Escape cierra y devuelve el foco.
 */
export function DropdownMenu({
  label,
  trigger,
  items,
  header,
  align = 'end',
  triggerClassName,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  const focusItem = (index: number) => {
    const count = items.length;
    if (count === 0) return;
    itemRefs.current[((index % count) + count) % count]?.focus();
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    focusItem(0);
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
    // focusItem es estable para el ciclo de vida del menú abierto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = itemRefs.current.indexOf(document.activeElement as HTMLElement);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusItem(current + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusItem(current - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(items.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        close(false);
        break;
    }
  };

  const itemClass = (disabled?: boolean) =>
    cn(
      'flex w-full items-start gap-3 rounded-control px-3 py-2.5 text-left text-label outline-none transition-interactive',
      '[&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0',
      disabled
        ? 'cursor-not-allowed text-muted'
        : 'text-text hover:bg-surface-muted focus:bg-primary-soft focus:text-primary-hover',
    );

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cn('rounded-pill transition-interactive focus-ring', triggerClassName)}
      >
        {trigger}
      </button>

      {open && (
        <div
          className={cn(
            'absolute top-full z-30 mt-2 w-64 animate-fade-in rounded-card border border-border bg-surface p-1.5 shadow-raised',
            align === 'end' ? 'right-0' : 'left-0',
          )}
          onKeyDown={onMenuKeyDown}
        >
          {header && <div className="border-b border-border px-3 pt-2 pb-3">{header}</div>}
          <div id={menuId} role="menu" aria-label={label} className={cn(header && 'pt-1.5')}>
            {items.map((item, index) => {
              const content = (
                <>
                  {item.icon}
                  <span className="min-w-0">
                    <span className="block font-medium">{item.label}</span>
                    {item.description && (
                      <span className="block text-caption text-muted">{item.description}</span>
                    )}
                  </span>
                </>
              );
              const setRef = (element: HTMLElement | null) => {
                itemRefs.current[index] = element;
              };

              if (item.to && !item.disabled) {
                return (
                  <Link
                    key={item.id}
                    ref={setRef}
                    to={item.to}
                    role="menuitem"
                    tabIndex={-1}
                    className={itemClass()}
                    onClick={() => close(false)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  ref={setRef}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  aria-disabled={item.disabled || undefined}
                  className={itemClass(item.disabled)}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onSelect?.();
                    close();
                  }}
                >
                  {content}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
