export interface LoginFormValues {
  email: string;
  password: string;
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validación de cliente del formulario de acceso (solo formato y obligatoriedad).
 * La validación de credenciales corresponde exclusivamente al servidor.
 */
export function validateLoginForm({ email, password }: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = 'Ingresa tu correo electrónico.';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Ingresa un correo válido, por ejemplo nombre@consulta.com.';
  }

  if (!password) {
    errors.password = 'Ingresa tu contraseña.';
  }

  return errors;
}

export function hasErrors(errors: LoginFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
