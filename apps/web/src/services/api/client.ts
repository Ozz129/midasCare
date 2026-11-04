import { type ApiErrorResponse } from '@care/api-contracts';

/** Error HTTP de la API con el cuerpo normalizado (si el servidor lo envió). */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorResponse | undefined;

  constructor(status: number, message: string, body?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  /** Errores de red o del servidor que pueden reintentarse. */
  get isRetryable(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
  /** Access token vigente (en memoria). Se envía como `Authorization: Bearer`. */
  getAccessToken?: () => string | null;
  /**
   * Se invoca ante un 401. Si devuelve `true` (sesión renovada), la petición se
   * repite UNA vez con el nuevo token.
   */
  onUnauthorized?: () => Promise<boolean>;
}

export interface ApiClient {
  get<T>(path: string, init?: RequestInit): Promise<T>;
  /** Descarga binaria autenticada (p. ej. imágenes privadas). */
  getBlob(path: string, init?: RequestInit): Promise<Blob>;
  /** `body` puede ser un objeto (JSON) o un FormData (multipart). */
  request<T>(method: string, path: string, body?: unknown, init?: RequestInit): Promise<T>;
}

type ResponseKind = 'json' | 'blob';

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'statusCode' in value &&
    'message' in value &&
    typeof (value as { statusCode: unknown }).statusCode === 'number'
  );
}

/**
 * Cliente HTTP centralizado. Todas las llamadas a la API pasan por aquí,
 * de modo que autenticación, tenant activo y manejo de errores se añadan en un único sitio.
 */
export function createApiClient({
  baseUrl,
  fetchFn = (...args) => fetch(...args),
  timeoutMs = 15_000,
  getAccessToken,
  onUnauthorized,
}: ApiClientOptions): ApiClient {
  const root = baseUrl.replace(/\/+$/, '');

  async function withRefresh<T>(attempt: () => Promise<T>): Promise<T> {
    try {
      return await attempt();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && onUnauthorized) {
        if (await onUnauthorized()) return attempt();
      }
      throw error;
    }
  }

  async function send(
    method: string,
    path: string,
    body: unknown,
    init: RequestInit,
    kind: ResponseKind,
  ): Promise<unknown> {
    const headers = new Headers(init.headers);
    headers.set('Accept', kind === 'json' ? 'application/json' : '*/*');
    const isForm = body instanceof FormData;
    // Con FormData el navegador fija el Content-Type multipart con su boundary.
    if (body !== undefined && !isForm) headers.set('Content-Type', 'application/json');
    const token = getAccessToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let response: Response;
    try {
      response = await fetchFn(`${root}/${path.replace(/^\/+/, '')}`, {
        ...init,
        method,
        headers,
        body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
        // Necesario para la cookie httpOnly del refresh token.
        credentials: 'include',
        signal: init.signal ?? AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new ApiError(0, 'No se pudo conectar con el servidor');
    }

    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => undefined);
      const errorBody = isApiErrorResponse(payload) ? payload : undefined;
      const message = Array.isArray(errorBody?.message)
        ? errorBody.message.join(', ')
        : (errorBody?.message ?? `Error HTTP ${response.status}`);
      throw new ApiError(response.status, message, errorBody);
    }

    if (kind === 'blob') return response.blob();
    return response.status === 204 ? undefined : response.json().catch(() => undefined);
  }

  const request = <T>(method: string, path: string, body?: unknown, init: RequestInit = {}) =>
    withRefresh(() => send(method, path, body, init, 'json') as Promise<T>);

  return {
    request,
    get: <T>(path: string, init?: RequestInit) => request<T>('GET', path, undefined, init),
    getBlob: (path: string, init: RequestInit = {}) =>
      withRefresh(() => send('GET', path, undefined, init, 'blob') as Promise<Blob>),
  };
}
