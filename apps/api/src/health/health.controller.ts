import { type HealthResponse } from '@care/api-contracts';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './health-response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Estado del servicio',
    description:
      'Endpoint público de liveness. Responde 200 mientras el proceso esté activo e indica el estado de la base de datos. No expone información sensible.',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  check(): Promise<HealthResponse> {
    return this.healthService.check();
  }
}
