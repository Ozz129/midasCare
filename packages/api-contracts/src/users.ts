/*
 * Contratos de usuarios (identidad global) y perfil propio.
 *   GET    /api/v1/users/me              -> MyProfileResponse
 *   PATCH  /api/v1/users/me              -> MyProfileResponse
 *   PUT    /api/v1/users/me/avatar       -> MyProfileResponse  (multipart, campo "file")
 *   GET    /api/v1/users/me/avatar       -> imagen (solo el propio usuario)
 *   DELETE /api/v1/users/me/avatar       -> MyProfileResponse
 *   PUT    /api/v1/users/me/signature    -> MyProfileResponse  (multipart, campo "file")
 *   GET    /api/v1/users/me/signature    -> imagen (solo el propio usuario)
 *   DELETE /api/v1/users/me/signature    -> MyProfileResponse
 */
import type { IsoDateTimeString, Nullable, Uuid, ValueOf } from '@care/shared-types';
import type { ProfessionalProfileResponse } from './professionals.js';

export const UserStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DISABLED: 'DISABLED',
} as const;
export type UserStatus = ValueOf<typeof UserStatus>;

/** Perfil público del usuario. Nunca incluye credenciales ni hashes. */
export interface UserProfileResponse {
  id: Uuid;
  email: string;
  givenName: string;
  familyName: string;
  status: UserStatus;
  createdAt: IsoDateTimeString;
  /** Hay foto de perfil cargada (se obtiene con GET /users/me/avatar). */
  hasAvatar: boolean;
  /** Cambia con cada nueva foto: útil para invalidar cachés. */
  avatarUpdatedAt: Nullable<IsoDateTimeString>;
}

/** Perfil completo del usuario autenticado. */
export interface MyProfileResponse {
  user: UserProfileResponse;
  professional: Nullable<ProfessionalProfileResponse>;
}

export interface UpdateMyProfileRequest {
  givenName?: string;
  familyName?: string;
  /** Nombre profesional visible (p. ej. "Ps. Ana Pérez"). */
  displayName?: string;
  /** Número de registro / colegiatura. `null` lo elimina. */
  licenseNumber?: Nullable<string>;
  /** Códigos de SPECIALTIES (máximo MAX_SPECIALTIES). */
  specialties?: string[];
}

/** @deprecated Usar UpdateMyProfileRequest. */
export type UpdateUserProfileRequest = Pick<UpdateMyProfileRequest, 'givenName' | 'familyName'>;

/** Imágenes de perfil aceptadas (se verifica el contenido real, no solo la extensión). */
export const PROFILE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const SIGNATURE_MAX_BYTES = 1024 * 1024;
