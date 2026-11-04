import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { Input, type InputProps } from './Input';

export type PasswordInputProps = Omit<InputProps, 'type' | 'trailing' | 'leadingIcon'>;

/** Campo de contraseña con botón accesible para mostrar u ocultar el valor. */
export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      leadingIcon={<Lock />}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          disabled={props.disabled}
          className="flex size-control-sm items-center justify-center rounded-control text-muted transition-interactive hover:bg-surface-muted hover:text-text focus-ring disabled:cursor-not-allowed"
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}
