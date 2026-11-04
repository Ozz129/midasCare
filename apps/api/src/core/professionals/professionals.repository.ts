import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfessionalProfile } from './entities/professional-profile.entity';

@Injectable()
export class ProfessionalsRepository {
  constructor(
    @InjectRepository(ProfessionalProfile)
    private readonly repository: Repository<ProfessionalProfile>,
  ) {}

  findByUserId(userId: string): Promise<ProfessionalProfile | null> {
    return this.repository.findOneBy({ userId });
  }

  save(profile: ProfessionalProfile): Promise<ProfessionalProfile> {
    return this.repository.save(profile);
  }

  create(data: Partial<ProfessionalProfile>): ProfessionalProfile {
    return this.repository.create(data);
  }
}
