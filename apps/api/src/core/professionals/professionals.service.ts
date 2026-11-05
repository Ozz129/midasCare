import { type ProfessionalProfileResponse } from '@care/api-contracts';
import { Injectable } from '@nestjs/common';
import { type EntityManager } from 'typeorm';
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

  /**
   * Devuelve el perfil del usuario o lo crea con el nombre visible indicado.
   * Con `manager`, la lectura y la posible creación ocurren dentro de esa transacción.
   */
  async getOrCreate(
    userId: string,
    defaultDisplayName: string,
    manager?: EntityManager,
  ): Promise<ProfessionalProfile> {
    const existing = await this.professionalsRepository.findByUserId(userId, manager);
    if (existing) return existing;
    return this.professionalsRepository.save(
      this.professionalsRepository.create({
        userId,
        displayName: defaultDisplayName,
        licenseNumber: null,
        specialties: [],
      }),
      manager,
    );
  }

  save(profile: ProfessionalProfile, manager?: EntityManager): Promise<ProfessionalProfile> {
    return this.professionalsRepository.save(profile, manager);
  }
}
