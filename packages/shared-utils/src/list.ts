/** Convierte una cadena separada por comas en una lista sin elementos vacíos ni duplicados. */
export function parseList(value: string | undefined | null, separator = ','): string[] {
  if (!value) return [];
  const items = value
    .split(separator)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return [...new Set(items)];
}
