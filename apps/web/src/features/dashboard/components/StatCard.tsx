import { type LucideIcon } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  /**
   * Valor real proveniente de la API. `null` = todavía no hay fuente de datos:
   * se muestra un estado vacío, NUNCA un número inventado ni un 0 engañoso.
   */
  value: number | null;
  /** Texto mostrado cuando `value` es `null`. */
  emptyText: string;
  isLoading?: boolean;
}

/** Tarjeta de resumen preparada para conectarse a una query de TanStack Query. */
export function StatCard({ icon: Icon, label, value, emptyText, isLoading }: StatCardProps) {
  return (
    <Card padding="sm" className="flex flex-col gap-3 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-label font-medium text-muted">{label}</p>
        <span
          className="flex size-9 items-center justify-center rounded-control bg-primary-soft text-primary-hover"
          aria-hidden="true"
        >
          <Icon className="size-[1.125rem]" />
        </span>
      </div>

      {isLoading ? (
        <div aria-busy="true">
          <span className="sr-only">Cargando {label}</span>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      ) : value === null ? (
        <div>
          <p className="text-page-title font-semibold text-border" aria-hidden="true">
            —
          </p>
          <p className="mt-1 text-helper text-muted">{emptyText}</p>
        </div>
      ) : (
        <p className="text-page-title font-semibold text-navy tabular-nums">
          {value.toLocaleString('es')}
        </p>
      )}
    </Card>
  );
}
