import { type ProfessionalProfileResponse } from '@care/api-contracts';
import { Injectable } from '@nestjs/common';
import { type ProfessionalProfile } from './entities/professional-profile.entity';
import { ProfessionalsRepository } from './professionals.repository';

/** Respuesta pública: nunca incluye la clave interna de la firma. */
export function toProfessionalProfileResponse(
  profile: ProfessionalProfile,
): ProfessionalProfileResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    licenseNumber: profile.licenseNumber,
    specialties: profile.specialties,
    hasSignature: Boolean(profile.signatureStorageKey),
    signatureUpdatedAt: profile.signatureUpdatedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class ProfessionalsService {
  constructor(private readonly professionalsRepository: ProfessionalsRepository) {}

  findProfileByUserId(userId: string): Promise<ProfessionalProfile | null> {
    return this.professionalsRepository.findByUserId(userId);
  }

  /** Devuelve el perfil del usuario o lo crea con el nombre visible indicado. */
  async getOrCreate(userId: string, defaultDisplayName: string): Promise<ProfessionalProfile> {
    const existing = await this.professionalsRepository.findByUserId(userId);
    if (existing) return existing;
    return this.professionalsRepository.save(
      this.professionalsRepository.create({
        userId,
        displayName: defaultDisplayName,
        licenseNumber: null,
        specialties: [],
      }),
    );
  }

  save(profile: ProfessionalProfile): Promise<ProfessionalProfile> {
    return this.professionalsRepository.save(profile);
  }
}
