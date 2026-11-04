import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { type AuthenticatedUser, type RequestWithContext } from '../types/request-context';

/**
 * Inyecta el usuario autenticado. Si no hay identidad en la petición responde 401
 * (fail-closed), de modo que nunca se ejecuta un handler con usuario indefinido.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    if (!request.user) {
      throw new UnauthorizedException();
    }
    return request.user;
  },
);
