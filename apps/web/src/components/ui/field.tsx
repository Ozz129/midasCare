import { CircleAlert } from 'lucide-react';
import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

/** Props comunes a todos los controles de formulario con etiqueta. */
export interface FieldProps {
  /** Etiqueta visible y permanente (nunca sustituida por el placeholder). */
  label: ReactNode;
  /** Texto de ayuda bajo el control. */
  hint?: ReactNode;
  /** Mensaje de error junto al campo. Activa `aria-invalid`. */
  error?: ReactNode;
  required?: boolean;
  /** Oculta visualmente la etiqueta (sigue disponible para lectores de pantalla). */
  hideLabel?: boolean;
}

export function FieldShell({
  label,
  hint,
  error,
  required,
  hideLabel,
  controlId,
  hintId,
  errorId,
  className,
  children,
}: FieldProps & {
  controlId: string;
  hintId: string;
  errorId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={controlId}
        className={cn('text-label font-medium text-text', hideLabel && 'sr-only')}
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
            <span className="sr-only"> (obligatorio)</span>
          </>
        )}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-helper text-danger">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-helper text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
