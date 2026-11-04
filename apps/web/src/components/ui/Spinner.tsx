import { LoaderCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

const sizes = { sm: 'size-4', md: 'size-5', lg: 'size-8' } as const;

export interface SpinnerProps {
  size?: keyof typeof sizes;
  /** Texto para lectores de pantalla. */
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label = 'Cargando', className }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex', className)}>
      <LoaderCircle className={cn('animate-spin', sizes[size])} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
