import { cloneElement, type ReactElement, type ReactNode, useEffect, useId, useState } from 'react';
import { cn } from '../../utils/cn';

export interface TooltipProps {
  content: ReactNode;
  /** Elemento enfocable que describe el tooltip. */
  children: ReactElement<{ 'aria-describedby'?: string }>;
  side?: 'top' | 'bottom';
  /** `end` alinea al borde derecho del disparador (útil junto al borde de pantalla). */
  align?: 'center' | 'end';
  /** Clases de la burbuja del tooltip. */
  className?: string;
  /** Clases del contenedor (p. ej. `flex w-full` para disparadores a todo el ancho). */
  wrapperClassName?: string;
}

/**
 * Tooltip accesible (WCAG 1.4.13): aparece con hover y con foco de teclado,
 * se puede recorrer con el puntero sin desaparecer y se descarta con Escape.
 * No debe contener información esencial que no esté disponible de otra forma.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  className,
  wrapperClassName,
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const describedBy = [children.props['aria-describedby'], id].filter(Boolean).join(' ');

  return (
    <span
      className={cn('relative inline-flex', wrapperClassName)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {cloneElement(children, { 'aria-describedby': describedBy })}
      <span
        role="tooltip"
        id={id}
        // Cerrado usa display:none (no ocupa espacio ni provoca scroll horizontal);
        // aria-describedby sigue funcionando con contenido oculto.
        className={cn(
          'absolute z-40 w-max max-w-60 rounded-control bg-navy px-2.5 py-1.5 text-caption font-medium text-white shadow-raised',
          align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          open ? 'block animate-fade-in' : 'hidden',
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
