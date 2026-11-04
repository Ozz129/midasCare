import { type UserTenantResponse } from '@care/api-contracts';
import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../../common/types/request-context';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembershipsService } from '../memberships/memberships.service';
import { toUserTenantResponse, UserTenantResponseDto } from './dto/tenant-response.dto';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @ApiOperation({
    summary: 'Espacios de trabajo del usuario',
    description:
      'Tenants en los que el usuario autenticado tiene una membresía activa, con su rol.',
  })
  @ApiOkResponse({ type: UserTenantResponseDto, isArray: true })
  @ApiUnauthorizedResponse()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<UserTenantResponse[]> {
    const memberships = await this.membershipsService.listActiveMemberships(user.id);
    return memberships
      .filter(
        (
          membership,
        ): membership is typeof membership & { tenant: NonNullable<typeof membership.tenant> } =>
          Boolean(membership.tenant),
      )
      .map(toUserTenantResponse);
  }
}
