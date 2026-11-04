import { CircleCheck, CircleX, RefreshCw, Server, TriangleAlert } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ApiError } from '../../../services/api';
import { useApiHealth } from '../hooks/useApiHealth';

/** Estado real de la API (GET /api/v1/health). Único dato en vivo del panel. */
export function SystemStatusCard() {
  const { data, error, isPending, isFetching, refetch } = useApiHealth();

  let status = <Skeleton className="h-6 w-24" />;
  if (data?.status === 'ok') {
    status = (
      <Badge tone="success" icon={<CircleCheck />}>
        Operativo
      </Badge>
    );
  } else if (data) {
    status = (
      <Badge tone="warning" icon={<TriangleAlert />}>
        Degradado
      </Badge>
    );
  } else if (error) {
    status = (
      <Badge tone="danger" icon={<CircleX />}>
        Sin conexión
      </Badge>
    );
  }

  return (
    <Card>
      <CardHeader
        icon={<Server />}
        title="Estado del sistema"
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Actualizar estado del sistema"
          >
            <RefreshCw
              className={isFetching ? 'size-4 animate-spin' : 'size-4'}
              aria-hidden="true"
            />
          </Button>
        }
      />

      <div aria-live="polite">
        {isPending && !error && <span className="sr-only">Comprobando estado del sistema</span>}
        <div className="flex items-center justify-between gap-3">
          <span className="text-label text-muted">API</span>
          {status}
        </div>
        {data && (
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-label">
            <div>
              <dt className="text-caption text-muted">Base de datos</dt>
              <dd className="mt-0.5 font-medium text-text">
                {data.checks.database === 'up' ? 'Conectada' : 'No disponible'}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted">Versión</dt>
              <dd className="mt-0.5 font-medium text-text tabular-nums">{data.version}</dd>
            </div>
          </dl>
        )}
        {error && (
          <p className="mt-3 text-helper text-muted">
            {error instanceof ApiError && error.status === 0
              ? 'No se pudo conectar con la API. Comprueba que el backend esté en ejecución.'
              : 'La API respondió con un error.'}
          </p>
        )}
      </div>
    </Card>
  );
}
