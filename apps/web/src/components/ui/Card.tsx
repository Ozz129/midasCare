import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

const paddings = { none: '', sm: 'p-4', md: 'p-5 sm:p-6' } as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof paddings;
}

/** Superficie base: fondo blanco, borde discreto, radio de 12px y sombra mínima. */
export function Card({ padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface shadow-card',
        paddings[padding],
        className,
      )}
      {...props}
    />
  );
}

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Icono decorativo junto al título. */
  icon?: ReactNode;
  action?: ReactNode;
  /** Nivel del encabezado para mantener una jerarquía correcta. */
  as?: 'h2' | 'h3';
  className?: string;
}

export function CardHeader({
  title,
  description,
  icon,
  action,
  as: Heading = 'h2',
  className,
}: CardHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary-hover [&_svg]:size-[1.125rem]"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <Heading className="text-card-title font-semibold text-navy">{title}</Heading>
          {description && <p className="mt-0.5 text-helper text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
