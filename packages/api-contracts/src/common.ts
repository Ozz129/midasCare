import type { IsoDateTimeString } from '@care/shared-types';

/** Prefijo común de todas las rutas de la API REST. */
export const API_PREFIX = 'api/v1';

/**
 * Cabecera HTTP con la que el cliente indica el tenant activo.
 * El backend SIEMPRE la valida contra las membresías del usuario autenticado;
 * nunca se confía en ella por sí sola.
 */
export const TENANT_HEADER = 'x-tenant-id';

/** Formato estándar de error devuelto por la API. */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  /** Mensaje legible o lista de errores de validación. Nunca incluye detalles internos. */
  message: string | string[];
  path: string;
  timestamp: IsoDateTimeString;
}

/** Respuesta paginada genérica. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
