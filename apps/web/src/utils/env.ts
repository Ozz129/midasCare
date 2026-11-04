const DEFAULT_DEV_API_URL = 'http://localhost:3000/api/v1';

export interface WebEnv {
  apiUrl: string;
  appEnv: string;
}

/**
 * Lee y valida las variables públicas de Vite.
 * En builds de staging/production VITE_API_URL es obligatoria (fail-fast).
 */
export function readWebEnv(env: ImportMetaEnv & { DEV?: boolean }): WebEnv {
  const rawApiUrl = env.VITE_API_URL?.trim();
  if (!rawApiUrl && !env.DEV) {
    throw new Error('VITE_API_URL no está definida. Revisa apps/web/.env.example.');
  }

  const apiUrl = (rawApiUrl || DEFAULT_DEV_API_URL).replace(/\/+$/, '');
  if (!/^https?:\/\//.test(apiUrl)) {
    throw new Error('VITE_API_URL debe ser una URL absoluta http(s).');
  }

  return { apiUrl, appEnv: env.VITE_APP_ENV?.trim() || 'development' };
}

export const webEnv: WebEnv = readWebEnv(import.meta.env);
