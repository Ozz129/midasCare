import { Module } from '@nestjs/common';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ProfessionalsModule } from '../professionals/professionals.module';
import { UsersModule } from '../users/users.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

/**
 * Perfil del usuario autenticado (/users/me): datos personales, perfil
 * profesional, foto y firma. Orquesta Users + Professionals + Storage.
 */
@Module({
  imports: [AuthModule, UsersModule, ProfessionalsModule, StorageModule, AuditModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
