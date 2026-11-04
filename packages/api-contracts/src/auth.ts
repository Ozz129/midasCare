/*
 * Contratos de autenticación (implementados).
 *   POST /api/v1/auth/register  -> AuthSessionResponse (+ cookie de refresh)
 *   POST /api/v1/auth/login     -> AuthSessionResponse (+ cookie de refresh)
 *   POST /api/v1/auth/refresh   -> AuthSessionResponse (rota la cookie de refresh)
 *   POST /api/v1/auth/logout    -> 204 (revoca la sesión y borra la cookie)
 *   GET  /api/v1/auth/me        -> AuthMeResponse (requiere Bearer)
 *
 * El refresh token NUNCA viaja en el cuerpo: se entrega en una cookie httpOnly.
 */
import type { UserProfileResponse } from './users.js';

/** Longitudes de contraseña aceptadas al registrarse. */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export interface RegisterRequest {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
  /** Nombre del espacio de trabajo individual. Por defecto, el nombre completo. */
  workspaceName?: string;
  /** Especialidad principal (código de SPECIALTIES). */
  specialty?: string;
  /** Número de registro / colegiatura profesional. */
  licenseNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSessionResponse {
  /** JWT de vida corta. Enviar como `Authorization: Bearer <token>`. */
  accessToken: string;
  /** Segundos hasta la expiración del access token. */
  expiresIn: number;
  user: UserProfileResponse;
}

export type AuthMeResponse = UserProfileResponse;
