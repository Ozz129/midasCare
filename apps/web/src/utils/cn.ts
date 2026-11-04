type ClassValue = string | number | bigint | boolean | null | undefined;

/** Une clases CSS condicionales; ignora cualquier valor que no sea una cadena no vacía. */
export function cn(...classes: ClassValue[]): string {
  return classes
    .filter((value): value is string => typeof value === 'string' && value !== '')
    .join(' ');
}
