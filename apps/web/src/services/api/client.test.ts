import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './client';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('createApiClient', () => {
  it('construye la URL y devuelve el JSON en respuestas correctas', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, { status: 'ok' }));
    const client = createApiClient({ baseUrl: 'http://api.test/api/v1/', fetchFn });

    await expect(client.get('/health')).resolves.toEqual({ status: 'ok' });

    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/api/v1/health');
    expect(init.method).toBe('GET');
    expect(init.credentials).toBe('include');
  });

  it('convierte el contrato ApiErrorResponse en ApiError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(400, {
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: ['email must be an email', 'password is too short'],
        path: '/api/v1/x',
        timestamp: new Date().toISOString(),
      }),
    );
    const client = createApiClient({ baseUrl: 'http://api.test', fetchFn });

    const error = await client.request('POST', 'x', { a: 1 }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).message).toBe('email must be an email, password is too short');
    expect((error as ApiError).isRetryable).toBe(false);
  });

  it('representa errores de red como ApiError con estado 0 (reintentable)', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const client = createApiClient({ baseUrl: 'http://api.test', fetchFn });

    const error = await client.get('health').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
    expect((error as ApiError).isRetryable).toBe(true);
  });
});

describe('autenticación en el cliente', () => {
  const unauthorized = () =>
    jsonResponse(401, {
      statusCode: 401,
      error: 'UNAUTHORIZED',
      message: 'Unauthorized',
      path: '/api/v1/x',
      timestamp: new Date().toISOString(),
    });

  it('envía el access token como Bearer', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetchFn,
      getAccessToken: () => 'tok',
    });

    await client.get('tenants');

    const [, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer tok');
  });

  it('ante un 401 renueva la sesión y repite la petición una sola vez', async () => {
    let token = 'expirado';
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const onUnauthorized = vi.fn(async () => {
      token = 'nuevo';
      return true;
    });
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetchFn,
      getAccessToken: () => token,
      onUnauthorized,
    });

    await expect(client.get('tenants')).resolves.toEqual({ ok: true });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    const [, retryInit] = fetchFn.mock.calls[1] as [string, RequestInit];
    expect(new Headers(retryInit.headers).get('Authorization')).toBe('Bearer nuevo');
  });

  it('si la renovación falla, propaga el 401 sin reintentar', async () => {
    const fetchFn = vi.fn().mockResolvedValue(unauthorized());
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetchFn,
      getAccessToken: () => 'tok',
      onUnauthorized: async () => false,
    });

    const error = await client.get('tenants').catch((e: unknown) => e);
    expect((error as ApiError).status).toBe(401);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
