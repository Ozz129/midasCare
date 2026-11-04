import {
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';

/**
 * Tabla accesible. En pantallas estrechas se desplaza horizontalmente dentro de
 * su contenedor (región con foco y nombre) sin provocar scroll en la página.
 */
export function Table({
  caption,
  hideCaption = true,
  className,
  children,
}: {
  /** Descripción de la tabla (obligatoria para lectores de pantalla). */
  caption: string;
  hideCaption?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={cn(
        'w-full overflow-x-auto rounded-card border border-border focus-ring',
        className,
      )}
    >
      <table className="w-full min-w-[36rem] border-collapse text-left text-label">
        <caption className={cn('p-4 text-left text-label font-semibold', hideCaption && 'sr-only')}>
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-surface-muted" {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-border bg-surface" {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-interactive hover:bg-background', className)} {...props} />;
}

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        'border-b border-border px-4 py-3 text-caption font-semibold tracking-wide text-text uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 align-middle text-text', className)} {...props} />;
}
