import { createParamDecorator, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { type RequestWithContext, type TenantContext } from '../../../common/types/request-context';

/**
 * Inyecta el contexto de tenant validado por TenantAccessGuard.
 * Si el guard no se ejecutó, responde 403 en lugar de continuar sin tenant.
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TenantContext => {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    if (!request.tenantContext) {
      throw new ForbiddenException();
    }
    return request.tenantContext;
  },
);
