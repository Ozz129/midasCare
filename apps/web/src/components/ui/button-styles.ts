import { cn } from '../../utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium transition-interactive focus-ring select-none ' +
  'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-card hover:bg-primary-hover active:bg-primary-hover ' +
    'disabled:bg-border disabled:text-muted disabled:shadow-none',
  secondary:
    'border border-border bg-surface text-text shadow-card hover:bg-surface-muted ' +
    'disabled:bg-surface-muted disabled:text-muted disabled:shadow-none',
  outline:
    'border border-primary bg-transparent text-primary hover:bg-primary-soft hover:text-primary-hover ' +
    'disabled:border-border disabled:text-muted disabled:bg-transparent',
  ghost:
    'bg-transparent text-text hover:bg-surface-muted disabled:text-muted disabled:bg-transparent',
  destructive:
    'bg-danger text-white shadow-card hover:brightness-90 ' +
    'disabled:bg-border disabled:text-muted disabled:shadow-none disabled:brightness-100',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-control-sm px-3 text-label',
  md: 'h-control px-4 text-label',
  lg: 'h-12 px-6 text-body',
  icon: 'size-control text-label',
};

/** Clases de botón reutilizables (p. ej. para enlaces con apariencia de botón). */
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className);
}
