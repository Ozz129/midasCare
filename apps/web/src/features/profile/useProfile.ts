import { type MyProfileResponse, type UpdateMyProfileRequest } from '@care/api-contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { profileApi, type ProfileImageKind } from '../../services/api';
import { useSession } from '../auth/session';
import { updateSessionUser } from '../auth/session-store';

export const profileQueryKey = ['profile', 'me'] as const;

export function useMyProfile() {
  const session = useSession();
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: ({ signal }) => profileApi.get(signal),
    enabled: session.status === 'authenticated',
  });
}

/** Tras cada cambio: actualiza la caché del perfil y el usuario de la sesión (header). */
function useApplyProfile() {
  const queryClient = useQueryClient();
  return (profile: MyProfileResponse) => {
    queryClient.setQueryData(profileQueryKey, profile);
    updateSessionUser(profile.user);
  };
}

export function useUpdateProfile() {
  const apply = useApplyProfile();
  return useMutation({
    mutationFn: (changes: UpdateMyProfileRequest) => profileApi.update(changes),
    onSuccess: apply,
  });
}

export function useUploadProfileImage(kind: ProfileImageKind) {
  const apply = useApplyProfile();
  return useMutation({
    mutationFn: (image: Blob) => profileApi.uploadImage(kind, image),
    onSuccess: apply,
  });
}

export function useDeleteProfileImage(kind: ProfileImageKind) {
  const apply = useApplyProfile();
  return useMutation({
    mutationFn: () => profileApi.deleteImage(kind),
    onSuccess: apply,
  });
}

/**
 * URL local (object URL) de una imagen privada del perfil. `version` debe cambiar
 * cuando la imagen cambia (p. ej. avatarUpdatedAt) para volver a descargarla.
 */
export function useProfileImageUrl(
  kind: ProfileImageKind,
  version: string | null | undefined,
): string | undefined {
  const { data } = useQuery({
    queryKey: ['profile', 'image', kind, version],
    queryFn: ({ signal }) => profileApi.imageBlob(kind, signal),
    enabled: Boolean(version),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 5 * 60_000,
  });
  // Un object URL por blob; se libera cuando cambia o al desmontar.
  const url = useMemo(
    () => (data && version ? URL.createObjectURL(data) : undefined),
    [data, version],
  );
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  return url;
}
