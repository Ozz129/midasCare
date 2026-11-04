/** Identificador UUID serializado como string (RFC 9562). */
export type Uuid = string;

/** Fecha/hora en formato ISO 8601 con zona horaria (p. ej. `2026-01-31T10:00:00.000Z`). */
export type IsoDateTimeString = string;

/** Valor que puede ser `null`. */
export type Nullable<T> = T | null;

/** Obtiene la unión de valores de un objeto constante (`as const`). */
export type ValueOf<T> = T[keyof T];

/** Entornos de despliegue soportados por la plataforma. */
export const APP_ENVIRONMENTS = ['development', 'staging', 'production'] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];
