import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** `compact` para usar dentro de tarjetas pequeñas. */
  size?: 'compact' | 'default';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        size === 'default' ? 'px-4 py-10' : 'px-2 py-6',
        className,
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-pill bg-primary-soft text-primary-hover',
          size === 'default' ? 'size-14' : 'size-11',
        )}
        aria-hidden="true"
      >
        <Icon className={size === 'default' ? 'size-6' : 'size-5'} />
      </span>
      <p className="mt-4 text-label font-semibold text-navy">{title}</p>
      {description && <p className="mt-1 max-w-sm text-helper text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
