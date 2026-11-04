import { type MyProfileResponse, type UpdateMyProfileRequest } from '@care/api-contracts';

export interface ProfileFormValues {
  givenName: string;
  familyName: string;
  displayName: string;
  licenseNumber: string;
  specialties: string[];
}

export type ProfileFormErrors = Partial<Record<keyof ProfileFormValues, string>>;

export function toFormValues(profile: MyProfileResponse): ProfileFormValues {
  return {
    givenName: profile.user.givenName,
    familyName: profile.user.familyName,
    displayName:
      profile.professional?.displayName ?? `${profile.user.givenName} ${profile.user.familyName}`,
    licenseNumber: profile.professional?.licenseNumber ?? '',
    specialties: profile.professional?.specialties ?? [],
  };
}

export function validateProfileForm(values: ProfileFormValues): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  if (!values.givenName.trim()) errors.givenName = 'Ingresa tu nombre.';
  else if (values.givenName.trim().length > 100) errors.givenName = 'Máximo 100 caracteres.';
  if (!values.familyName.trim()) errors.familyName = 'Ingresa tus apellidos.';
  else if (values.familyName.trim().length > 100) errors.familyName = 'Máximo 100 caracteres.';
  if (!values.displayName.trim()) errors.displayName = 'Ingresa tu nombre profesional.';
  else if (values.displayName.trim().length > 200) errors.displayName = 'Máximo 200 caracteres.';
  if (values.licenseNumber.trim().length > 100) errors.licenseNumber = 'Máximo 100 caracteres.';
  return errors;
}

/** Solo envía los campos modificados. */
export function diffProfile(
  initial: ProfileFormValues,
  current: ProfileFormValues,
): UpdateMyProfileRequest {
  const changes: UpdateMyProfileRequest = {};
  const trimmed = (value: string) => value.trim();
  if (trimmed(current.givenName) !== initial.givenName)
    changes.givenName = trimmed(current.givenName);
  if (trimmed(current.familyName) !== initial.familyName)
    changes.familyName = trimmed(current.familyName);
  if (trimmed(current.displayName) !== initial.displayName)
    changes.displayName = trimmed(current.displayName);
  if (trimmed(current.licenseNumber) !== initial.licenseNumber)
    changes.licenseNumber = trimmed(current.licenseNumber) || null;
  if (current.specialties.join('|') !== initial.specialties.join('|'))
    changes.specialties = current.specialties;
  return changes;
}
