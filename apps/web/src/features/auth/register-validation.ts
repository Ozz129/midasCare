import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, SPECIALTY_CODES } from '@care/api-contracts';

export interface RegisterFormValues {
  givenName: string;
  familyName: string;
  email: string;
  password: string;
  confirmPassword: string;
  specialty: string;
  licenseNumber: string;
  workspaceName: string;
}

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Campos de cada paso, en el orden en que se muestran (para enfocar el primer error). */
export const REGISTER_STEPS = {
  account: ['givenName', 'familyName', 'email', 'password', 'confirmPassword'],
  practice: ['specialty', 'licenseNumber', 'workspaceName'],
} as const satisfies Record<string, ReadonlyArray<keyof RegisterFormValues>>;

export type RegisterStep = keyof typeof REGISTER_STEPS;

export const REGISTER_FIELD_ORDER: Array<keyof RegisterFormValues> = [
  ...REGISTER_STEPS.account,
  ...REGISTER_STEPS.practice,
];

/** Errores solo de los campos de un paso. */
export function validateRegisterStep(
  step: RegisterStep,
  values: RegisterFormValues,
): RegisterFormErrors {
  const all = validateRegisterForm(values);
  const fields: ReadonlyArray<keyof RegisterFormValues> = REGISTER_STEPS[step];
  return Object.fromEntries(
    Object.entries(all).filter(([field]) => fields.includes(field as keyof RegisterFormValues)),
  ) as RegisterFormErrors;
}

/** Validación de cliente. Las mismas reglas se aplican de nuevo en el servidor. */
export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};
  const givenName = values.givenName.trim();
  const familyName = values.familyName.trim();
  const email = values.email.trim();

  if (!givenName) errors.givenName = 'Ingresa tu nombre.';
  else if (givenName.length > 100) errors.givenName = 'Máximo 100 caracteres.';

  if (!familyName) errors.familyName = 'Ingresa tus apellidos.';
  else if (familyName.length > 100) errors.familyName = 'Máximo 100 caracteres.';

  if (!email) errors.email = 'Ingresa tu correo electrónico.';
  else if (!EMAIL_PATTERN.test(email) || email.length > 320)
    errors.email = 'Ingresa un correo válido, por ejemplo nombre@consulta.com.';

  if (!values.password) errors.password = 'Crea una contraseña.';
  else if (values.password.length < PASSWORD_MIN_LENGTH)
    errors.password = `Usa al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  else if (values.password.length > PASSWORD_MAX_LENGTH)
    errors.password = `Usa como máximo ${PASSWORD_MAX_LENGTH} caracteres.`;

  if (!values.confirmPassword) errors.confirmPassword = 'Repite la contraseña.';
  else if (values.confirmPassword !== values.password)
    errors.confirmPassword = 'Las contraseñas no coinciden.';

  if (!values.specialty) errors.specialty = 'Selecciona tu especialidad.';
  else if (!(SPECIALTY_CODES as readonly string[]).includes(values.specialty))
    errors.specialty = 'Especialidad no válida.';

  if (values.licenseNumber.trim().length > 100) errors.licenseNumber = 'Máximo 100 caracteres.';
  if (values.workspaceName.trim().length > 200) errors.workspaceName = 'Máximo 200 caracteres.';

  return errors;
}

export type PasswordStrength = 'empty' | 'short' | 'fair' | 'strong';

/**
 * Indicador orientativo: longitud mínima + variedad de caracteres.
 * La longitud es el factor principal (NIST SP 800-63B); no se imponen reglas de composición.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 'empty';
  if (password.length < PASSWORD_MIN_LENGTH) return 'short';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  return password.length >= 16 || classes >= 3 ? 'strong' : 'fair';
}
