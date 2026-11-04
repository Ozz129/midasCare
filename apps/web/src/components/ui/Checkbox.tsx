import { Check } from 'lucide-react';
import { type InputHTMLAttributes, type ReactNode, type Ref, useId } from 'react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({
  id,
  label,
  description,
  error,
  className,
  disabled,
  ref,
  ...props
}: CheckboxProps) {
  const generated = useId();
  const controlId = id ?? generated;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex min-h-control-sm items-start gap-3">
        <span className="relative mt-0.5 flex size-5 shrink-0">
          <input
            ref={ref}
            id={controlId}
            type="checkbox"
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
            className={cn(
              'peer size-5 cursor-pointer appearance-none rounded-[0.3rem] border bg-surface transition-interactive focus-ring',
              error ? 'border-danger' : 'border-input-border hover:border-text',
              'checked:border-primary checked:bg-primary',
              'disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-muted',
            )}
            {...props}
          />
          <Check
            className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100"
            strokeWidth={3}
            aria-hidden="true"
          />
        </span>
        <label
          htmlFor={controlId}
          className={cn(
            'cursor-pointer text-label text-text select-none',
            disabled && 'cursor-not-allowed text-muted',
          )}
        >
          <span className="font-medium">{label}</span>
          {description && (
            <span id={descriptionId} className="mt-0.5 block text-helper text-muted">
              {description}
            </span>
          )}
        </label>
      </div>
      {error && (
        <p id={errorId} className="pl-8 text-helper text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
