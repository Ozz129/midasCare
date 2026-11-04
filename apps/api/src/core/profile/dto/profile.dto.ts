import {
  MAX_SPECIALTIES,
  type MyProfileResponse,
  type ProfessionalProfileResponse,
  SPECIALTY_CODES,
  type UpdateMyProfileRequest,
} from '@care/api-contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserProfileResponseDto } from '../../auth/dto/auth.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateMyProfileDto implements UpdateMyProfileRequest {
  @ApiPropertyOptional({ example: 'Ana' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  givenName?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  familyName?: string;

  @ApiPropertyOptional({ example: 'Ps. Ana Pérez' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  displayName?: string;

  @ApiPropertyOptional({ example: 'COP-12345', nullable: true })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @ValidateIf((_object, value) => value !== null)
  @IsString()
  @MaxLength(100)
  licenseNumber?: string | null;

  @ApiPropertyOptional({ enum: SPECIALTY_CODES, isArray: true, maxItems: MAX_SPECIALTIES })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_SPECIALTIES)
  @ArrayUnique()
  @IsIn(SPECIALTY_CODES, { each: true, message: 'Especialidad no válida.' })
  specialties?: string[];
}

export class ProfessionalProfileResponseDto implements ProfessionalProfileResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) userId!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ nullable: true, type: String }) licenseNumber!: string | null;
  @ApiProperty({ enum: SPECIALTY_CODES, isArray: true }) specialties!: string[];
  @ApiProperty() hasSignature!: boolean;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  signatureUpdatedAt!: string | null;
}

export class MyProfileResponseDto implements MyProfileResponse {
  @ApiProperty({ type: UserProfileResponseDto }) user!: UserProfileResponseDto;
  @ApiProperty({ type: ProfessionalProfileResponseDto, nullable: true })
  professional!: ProfessionalProfileResponseDto | null;
}
