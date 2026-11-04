import { type DependencyStatus, type HealthResponse, type HealthStatus } from '@care/api-contracts';
import { ApiProperty } from '@nestjs/swagger';

class HealthChecksDto {
  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  database!: DependencyStatus;
}

export class HealthResponseDto implements HealthResponse {
  @ApiProperty({ enum: ['ok', 'degraded'], example: 'ok' })
  status!: HealthStatus;

  @ApiProperty({ example: 'midas-care-api' })
  service!: string;

  @ApiProperty({ example: '0.1.0' })
  version!: string;

  @ApiProperty({ enum: ['development', 'staging', 'production', 'test'] })
  environment!: HealthResponse['environment'];

  @ApiProperty({ format: 'date-time' })
  timestamp!: string;

  @ApiProperty({ type: HealthChecksDto })
  checks!: HealthChecksDto;
}
