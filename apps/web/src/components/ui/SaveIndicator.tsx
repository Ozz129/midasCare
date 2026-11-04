import { CircleAlert, CircleCheck, CircleDot } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

const config: Record<
  Exclude<SaveStatus, 'idle' | 'saving'>,
  { label: string; className: string; Icon: typeof CircleDot }
> = {
  unsaved: { label: 'Cambios sin guardar', className: 'text-warning', Icon: CircleDot },
  saved: { label: 'Guardado', className: 'text-success-strong', Icon: CircleCheck },
  error: { label: 'No se pudo guardar', className: 'text-danger', Icon: CircleAlert },
};

/**
 * Indicador de guardado para formularios clínicos. Anuncia los cambios de
 * estado a lectores de pantalla (aria-live) sin interrumpir.
 */
export function SaveIndicator({
  status,
  savedAt,
  className,
}: {
  status: SaveStatus;
  /** Hora del último guardado, ya formateada. */
  savedAt?: string;
  className?: string;
}) {
  return (
    <p aria-live="polite" className={cn('inline-flex items-center gap-1.5 text-helper', className)}>
      {status === 'saving' && (
        <>
          <Spinner size="sm" label="Guardando" className="text-muted" />
          <span className="text-muted">Guardando…</span>
        </>
      )}
      {status !== 'idle' &&
        status !== 'saving' &&
        (() => {
          const { label, className: tone, Icon } = config[status];
          return (
            <span className={cn('inline-flex items-center gap-1.5', tone)}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
              {status === 'saved' && savedAt && <span className="text-muted">· {savedAt}</span>}
            </span>
          );
        })()}
    </p>
  );
}
