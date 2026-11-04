import { createHash, randomBytes } from 'node:crypto';
import { API_PREFIX } from '@care/api-contracts';

/** Cookie httpOnly que transporta el refresh token. */
export const REFRESH_COOKIE_NAME = 'mc_refresh';
/** La cookie solo se envía a las rutas de autenticación. */
export const REFRESH_COOKIE_PATH = `/${API_PREFIX}/auth`;

export const ACCESS_TOKEN_ISSUER = 'midas-care-api';
export const ACCESS_TOKEN_AUDIENCE = 'midas-care';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  /** Id de la sesión (auth_sessions) que emitió el token. */
  sid: string;
}

/** Refresh token opaco: 256 bits aleatorios. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Solo se almacena el SHA-256 del refresh token, nunca el token. */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Lee una cookie de la cabecera `Cookie` sin dependencias adicionales. */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}
