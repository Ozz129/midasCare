import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_CONFIG } from '../../config/app-config.module';
import { type AppConfig } from '../../config/environment';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';
import { AuthSessionsRepository } from './auth-sessions.repository';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSession } from './entities/auth-session.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordHasher } from './password-hasher';

/**
 * Autenticación, sesiones y protección de endpoints.
 * - Access token: JWT HS256 de vida corta (AUTH_ACCESS_TOKEN_TTL_SECONDS).
 * - Refresh token: opaco, rotatorio, guardado como SHA-256 en auth_sessions y
 *   entregado en cookie httpOnly + SameSite=Strict (Secure fuera de development).
 * - Otros módulos protegen sus endpoints con JwtAuthGuard (exportado).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AuthSession]),
    UsersModule,
    AuditModule,
    // Límite por IP para login/registro. Detrás de un proxy, configurar "trust proxy".
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.auth.accessTokenSecret,
        signOptions: { algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthSessionsRepository, PasswordHasher, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
