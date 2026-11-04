/** Garantiza en compilación que todos los casos de una unión discriminada fueron tratados. */
export function assertNever(value: never, message = 'Valor no contemplado'): never {
  throw new Error(`${message}: ${String(value)}`);
}
