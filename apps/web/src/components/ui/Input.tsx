import { type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '../../utils/cn';
import { FieldShell, type FieldProps } from './field';
import { controlClassName, describedBy, useFieldIds } from './field-utils';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, FieldProps {
  /** Icono decorativo a la izquierda. */
  leadingIcon?: ReactNode;
  /** Elemento interactivo a la derecha (p. ej. mostrar/ocultar contraseña). */
  trailing?: ReactNode;
  containerClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  id,
  label,
  hint,
  error,
  required,
  hideLabel,
  leadingIcon,
  trailing,
  className,
  containerClassName,
  'aria-describedby': ariaDescribedBy,
  ref,
  ...props
}: InputProps) {
  const ids = useFieldIds(id);

  return (
    <FieldShell
      {...ids}
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
      className={containerClassName}
    >
      <div className="relative">
        {leadingIcon && (
          <span
            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted [&_svg]:size-4"
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={ids.controlId}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, { hint, error }, ariaDescribedBy)}
          className={controlClassName(
            Boolean(error),
            cn('h-control px-3', leadingIcon && 'pl-9', trailing && 'pr-11', className),
          )}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
    </FieldShell>
  );
}
