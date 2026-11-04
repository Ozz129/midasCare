import { type MembershipRole, TENANT_HEADER } from '@care/api-contracts';
import { isUuid } from '@care/shared-utils';
import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type RequestWithContext } from '../../../common/types/request-context';
import { MembershipsService } from '../../memberships/memberships.service';
import { REQUIRED_ROLES_KEY } from '../decorators/require-roles.decorator';

/**
 * Autoriza el acceso a un tenant:
 *   1. exige un usuario autenticado (establecido por AuthModule);
 *   2. lee el tenant solicitado de la cabecera `x-tenant-id`;
 *   3. lo valida contra una membresía ACTIVA del usuario (nunca se confía en el cliente);
 *   4. comprueba los roles requeridos con @RequireRoles();
 *   5. publica el TenantContext validado en la petición.
 *
 * Fail-closed: mientras AuthModule no autentique peticiones, `request.user`
 * nunca existe y este guard responde 401 siempre.
 */
@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly membershipsService: MembershipsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();

    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }

    const tenantId = request.header(TENANT_HEADER);
    if (!isUuid(tenantId)) {
      throw new BadRequestException(`Cabecera ${TENANT_HEADER} ausente o inválida`);
    }

    const membership = await this.membershipsService.findActiveMembership(user.id, tenantId);
    if (!membership) {
      // Mismo error para "no existe" y "no pertenece": no revela qué tenants existen.
      throw new ForbiddenException();
    }

    const requiredRoles = this.reflector.getAllAndOverride<MembershipRole[] | undefined>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiredRoles?.length && !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException();
    }

    request.tenantContext = {
      tenantId: membership.tenantId,
      userId: user.id,
      membershipId: membership.id,
      role: membership.role,
    };
    return true;
  }
}
