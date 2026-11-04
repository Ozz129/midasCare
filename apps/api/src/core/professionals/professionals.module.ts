import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionalProfile } from './entities/professional-profile.entity';
import { ProfessionalsRepository } from './professionals.repository';
import { ProfessionalsService } from './professionals.service';

/** Perfil profesional, especialidades y relación con organizaciones. */
@Module({
  imports: [TypeOrmModule.forFeature([ProfessionalProfile])],
  providers: [ProfessionalsRepository, ProfessionalsService],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
