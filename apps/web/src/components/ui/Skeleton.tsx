import { cn } from '../../utils/cn';

/** Marcador de carga. Es decorativo: el estado se anuncia con un Spinner o texto. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse rounded-control bg-surface-muted', className)}
    />
  );
}
