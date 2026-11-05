import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type EntityManager, Repository } from 'typeorm';
import { ProfessionalProfile } from './entities/professional-profile.entity';

@Injectable()
export class ProfessionalsRepository {
  constructor(
    @InjectRepository(ProfessionalProfile)
    private readonly repository: Repository<ProfessionalProfile>,
  ) {}

  /** Repositorio ligado a la transacción `manager` si se indica; si no, el habitual. */
  private repo(manager?: EntityManager): Repository<ProfessionalProfile> {
    return manager ? manager.getRepository(ProfessionalProfile) : this.repository;
  }

  findByUserId(userId: string, manager?: EntityManager): Promise<ProfessionalProfile | null> {
    return this.repo(manager).findOneBy({ userId });
  }

  save(profile: ProfessionalProfile, manager?: EntityManager): Promise<ProfessionalProfile> {
    return this.repo(manager).save(profile);
  }

  create(data: Partial<ProfessionalProfile>): ProfessionalProfile {
    return this.repository.create(data);
  }
}
