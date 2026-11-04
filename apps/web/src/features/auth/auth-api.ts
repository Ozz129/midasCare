import {
  type AuthSessionResponse,
  type LoginRequest,
  type RegisterRequest,
} from '@care/api-contracts';
import { createApiClient } from '../../services/api/client';
import { webEnv } from '../../utils/env';

/**
 * Cliente exclusivo de los endpoints de autenticación. NO reintenta ante 401
 * (evita bucles de renovación). El refresh token viaja solo en la cookie httpOnly.
 */
const authClient = createApiClient({ baseUrl: webEnv.apiUrl });

export const authApi = {
  register: (data: RegisterRequest) =>
    authClient.request<AuthSessionResponse>('POST', 'auth/register', data),
  login: (credentials: LoginRequest) =>
    authClient.request<AuthSessionResponse>('POST', 'auth/login', credentials),
  refresh: () => authClient.request<AuthSessionResponse>('POST', 'auth/refresh'),
  logout: () => authClient.request<void>('POST', 'auth/logout'),
};
