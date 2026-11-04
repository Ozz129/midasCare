import { type MyProfileResponse } from '@care/api-contracts';
import { describe, expect, it } from 'vitest';
import { diffProfile, toFormValues, validateProfileForm } from './profile-form';

const profile: MyProfileResponse = {
  user: {
    id: 'u1',
    email: 'ana@consulta.com',
    givenName: 'Ana',
    familyName: 'Pérez',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    hasAvatar: false,
    avatarUpdatedAt: null,
  },
  professional: {
    id: 'p1',
    userId: 'u1',
    displayName: 'Ana Pérez',
    licenseNumber: 'COP-1',
    specialties: ['PSYCHOLOGY'],
    hasSignature: false,
    signatureUpdatedAt: null,
  },
};

describe('perfil', () => {
  it('sin cambios no envía nada', () => {
    const initial = toFormValues(profile);
    expect(diffProfile(initial, { ...initial })).toEqual({});
  });

  it('envía solo lo modificado y normaliza la licencia vacía a null', () => {
    const initial = toFormValues(profile);
    const changes = diffProfile(initial, {
      ...initial,
      givenName: ' Ana María ',
      licenseNumber: '  ',
      specialties: ['PSYCHOLOGY', 'NEUROPSYCHOLOGY'],
    });
    expect(changes).toEqual({
      givenName: 'Ana María',
      licenseNumber: null,
      specialties: ['PSYCHOLOGY', 'NEUROPSYCHOLOGY'],
    });
  });

  it('sin perfil profesional usa el nombre completo como nombre visible', () => {
    expect(toFormValues({ ...profile, professional: null }).displayName).toBe('Ana Pérez');
  });

  it('exige nombre, apellidos y nombre profesional', () => {
    const errors = validateProfileForm({
      givenName: '',
      familyName: ' ',
      displayName: '',
      licenseNumber: '',
      specialties: [],
    });
    expect(Object.keys(errors).sort()).toEqual(['displayName', 'familyName', 'givenName']);
  });
});
