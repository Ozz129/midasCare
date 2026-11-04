/*
 * Contratos de perfiles profesionales.
 * El perfil profesional es independiente de la identidad global del usuario.
 */
import type { IsoDateTimeString, Nullable, Uuid } from '@care/shared-types';

/**
 * Catálogo de especialidades. El MVP comienza por psicología, pero el modelo
 * acepta varias especialidades por profesional y nuevas sin cambios de esquema.
 */
export const SPECIALTIES = [
  { code: 'PSYCHOLOGY', label: 'Psicología' },
  { code: 'CLINICAL_PSYCHOLOGY', label: 'Psicología clínica' },
  { code: 'NEUROPSYCHOLOGY', label: 'Neuropsicología' },
  { code: 'PSYCHIATRY', label: 'Psiquiatría' },
  { code: 'GENERAL_MEDICINE', label: 'Medicina general' },
  { code: 'PEDIATRICS', label: 'Pediatría' },
  { code: 'NUTRITION', label: 'Nutrición y dietética' },
  { code: 'PHYSIOTHERAPY', label: 'Fisioterapia' },
  { code: 'OCCUPATIONAL_THERAPY', label: 'Terapia ocupacional' },
  { code: 'SPEECH_THERAPY', label: 'Fonoaudiología / Logopedia' },
  { code: 'NURSING', label: 'Enfermería' },
  { code: 'DENTISTRY', label: 'Odontología' },
] as const;

export type SpecialtyCode = (typeof SPECIALTIES)[number]['code'];

export const SPECIALTY_CODES: readonly SpecialtyCode[] = SPECIALTIES.map((item) => item.code);

/** Máximo de especialidades por profesional. */
export const MAX_SPECIALTIES = 5;

export function specialtyLabel(code: string): string {
  return SPECIALTIES.find((item) => item.code === code)?.label ?? code;
}

/** @deprecated Usar SPECIALTIES. */
export const KnownSpecialty = {
  PSYCHOLOGY: 'PSYCHOLOGY',
} as const;

export interface ProfessionalProfileResponse {
  id: Uuid;
  userId: Uuid;
  displayName: string;
  licenseNumber: Nullable<string>;
  specialties: string[];
  /** Hay una firma digitalizada cargada. La imagen solo la obtiene su dueño. */
  hasSignature: boolean;
  signatureUpdatedAt: Nullable<IsoDateTimeString>;
}
