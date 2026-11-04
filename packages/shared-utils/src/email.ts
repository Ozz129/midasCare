/** Normaliza un correo electrónico para comparación y almacenamiento (trim + minúsculas). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
