import { type Ref, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { FieldShell, type FieldProps } from './field';
import { controlClassName, describedBy, useFieldIds } from './field-utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {
  /** Muestra un contador de caracteres cuando se define `maxLength`. */
  showCount?: boolean;
  containerClassName?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

/**
 * Área de texto pensada para notas clínicas extensas: tipografía de 16px,
 * interlineado amplio, altura cómoda y redimensionable verticalmente.
 */
export function Textarea({
  id,
  label,
  hint,
  error,
  required,
  hideLabel,
  showCount,
  maxLength,
  value,
  rows = 6,
  className,
  containerClassName,
  'aria-describedby': ariaDescribedBy,
  ref,
  ...props
}: TextareaProps) {
  const ids = useFieldIds(id);
  const countId = `${ids.controlId}-count`;
  const length = typeof value === 'string' ? value.length : 0;
  const counted = showCount && maxLength !== undefined;

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
      <textarea
        ref={ref}
        id={ids.controlId}
        rows={rows}
        value={value}
        maxLength={maxLength}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(
          ids,
          { hint, error },
          [ariaDescribedBy, counted ? countId : undefined].filter(Boolean).join(' ') || undefined,
        )}
        className={controlClassName(
          Boolean(error),
          cn('min-h-32 resize-y px-3 py-2.5 text-body-lg', className),
        )}
        {...props}
      />
      {counted && (
        <p id={countId} className="self-end text-caption text-muted tabular-nums">
          {length} / {maxLength}
        </p>
      )}
    </FieldShell>
  );
}
