import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

/** Encabezado de página: único <h1> de cada vista. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
    >
      <div className="min-w-0">
        {eyebrow && <p className="text-label font-medium text-primary">{eyebrow}</p>}
        <h1 className="mt-1 text-page-title font-semibold text-navy">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-body text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
