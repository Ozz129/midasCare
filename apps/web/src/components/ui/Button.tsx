import { LoaderCircle } from 'lucide-react';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { type ButtonSize, type ButtonVariant, buttonClassName } from './button-styles';
import { Spinner } from './Spinner';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Muestra un indicador de carga y deshabilita el botón. */
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  loading = false,
  loadingLabel = 'Procesando',
  leadingIcon,
  className,
  type = 'button',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading ? (
        children ? (
          // Con texto visible, el spinner es decorativo: aria-busy comunica el estado.
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Spinner size="sm" label={loadingLabel} />
        )
      ) : (
        leadingIcon
      )}
      {children}
    </button>
  );
}
