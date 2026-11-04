import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

/*
 * Todas las combinaciones texto/fondo cumplen AA (ver styles/tokens.css).
 * `brand` (dorado) es SOLO identidad de marca: nunca representa un estado clínico.
 */
const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-text border-border',
  primary: 'bg-primary-soft text-primary-hover border-primary/20',
  success: 'bg-success-soft text-success-strong border-success/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  info: 'bg-info-soft text-info border-info/20',
  brand: 'bg-gold-soft text-navy border-gold/40',
};

export interface BadgeProps {
  tone?: BadgeTone;
  /** Icono decorativo; el significado lo aporta siempre el texto. */
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', icon, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 text-caption font-medium whitespace-nowrap',
        '[&_svg]:size-3.5 [&_svg]:shrink-0',
        tones[tone],
        className,
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
