import {
  type AuthSessionResponse,
  type LoginRequest,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type RegisterRequest,
  SPECIALTY_CODES,
  type UserProfileResponse,
  UserStatus,
} from '@care/api-contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto implements RegisterRequest {
  @ApiProperty({ example: 'ana.perez@consulta.com' })
  @Transform(trim)
  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  @MaxLength(320)
  email!: string;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  })
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;

  @ApiProperty({ example: 'Ana' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  givenName!: string;

  @ApiProperty({ example: 'Pérez' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  familyName!: string;

  @ApiPropertyOptional({ example: 'Consulta Ana Pérez' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  workspaceName?: string;

  @ApiPropertyOptional({ enum: SPECIALTY_CODES, example: 'PSYCHOLOGY' })
  @IsOptional()
  @IsIn(SPECIALTY_CODES, { message: 'Especialidad no válida.' })
  specialty?: string;

  @ApiPropertyOptional({ example: 'COP-12345' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  licenseNumber?: string;
}

export class LoginDto implements LoginRequest {
  @ApiProperty({ example: 'ana.perez@consulta.com' })
  @Transform(trim)
  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  @MaxLength(320)
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  // Límite superior para evitar abusos de CPU/memoria en el hash.
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}

export class UserProfileResponseDto implements UserProfileResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() givenName!: string;
  @ApiProperty() familyName!: string;
  @ApiProperty({ enum: Object.values(UserStatus) }) status!: UserStatus;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty() hasAvatar!: boolean;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  avatarUpdatedAt!: string | null;
}

export class AuthSessionResponseDto implements AuthSessionResponse {
  @ApiProperty({ description: 'JWT de vida corta. Enviar como Authorization: Bearer <token>.' })
  accessToken!: string;

  @ApiProperty({ example: 900 })
  expiresIn!: number;

  @ApiProperty({ type: UserProfileResponseDto })
  user!: UserProfileResponseDto;
}
