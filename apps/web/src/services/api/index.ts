import {
  type HealthResponse,
  type MyProfileResponse,
  type UpdateMyProfileRequest,
  type UserTenantResponse,
} from '@care/api-contracts';
import { getAccessToken, refreshSession } from '../../features/auth/session-store';
import { webEnv } from '../../utils/env';
import { createApiClient } from './client';

export { ApiError } from './client';

/** Cliente principal: adjunta el access token y renueva la sesión ante un 401. */
export const apiClient = createApiClient({
  baseUrl: webEnv.apiUrl,
  getAccessToken,
  onUnauthorized: refreshSession,
});

export const healthApi = {
  get: (signal?: AbortSignal) => apiClient.get<HealthResponse>('health', { signal }),
};

export const tenantsApi = {
  listMine: (signal?: AbortSignal) => apiClient.get<UserTenantResponse[]>('tenants', { signal }),
};

export type ProfileImageKind = 'avatar' | 'signature';

const asForm = (blob: Blob, filename: string) => {
  const form = new FormData();
  form.append('file', blob, filename);
  return form;
};

export const profileApi = {
  get: (signal?: AbortSignal) => apiClient.get<MyProfileResponse>('users/me', { signal }),
  update: (changes: UpdateMyProfileRequest) =>
    apiClient.request<MyProfileResponse>('PATCH', 'users/me', changes),
  uploadImage: (kind: ProfileImageKind, image: Blob) =>
    apiClient.request<MyProfileResponse>(
      'PUT',
      `users/me/${kind}`,
      asForm(image, `${kind}.${image.type === 'image/png' ? 'png' : 'webp'}`),
    ),
  deleteImage: (kind: ProfileImageKind) =>
    apiClient.request<MyProfileResponse>('DELETE', `users/me/${kind}`),
  /** Imagen privada: requiere el access token, por eso no se usa directamente en <img src>. */
  imageBlob: (kind: ProfileImageKind, signal?: AbortSignal) =>
    apiClient.getBlob(`users/me/${kind}`, { signal }),
};
