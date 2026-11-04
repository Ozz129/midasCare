import { ChevronDown } from 'lucide-react';
import { type Ref, type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { FieldShell, type FieldProps } from './field';
import { controlClassName, describedBy, useFieldIds } from './field-utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {
  options: SelectOption[];
  /** Opción vacía inicial (p. ej. "Selecciona una opción"). */
  placeholder?: string;
  containerClassName?: string;
  ref?: Ref<HTMLSelectElement>;
}

/** Select nativo con estilo del sistema: accesible y usable en móvil/tablet sin dependencias. */
export function Select({
  id,
  label,
  hint,
  error,
  required,
  hideLabel,
  options,
  placeholder,
  className,
  containerClassName,
  'aria-describedby': ariaDescribedBy,
  ref,
  ...props
}: SelectProps) {
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
        <select
          ref={ref}
          id={ids.controlId}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, { hint, error }, ariaDescribedBy)}
          className={controlClassName(
            Boolean(error),
            cn('h-control cursor-pointer appearance-none pr-10 pl-3', className),
          )}
          {...props}
        >
          {placeholder !== undefined && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
}
