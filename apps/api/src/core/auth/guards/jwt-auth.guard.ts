import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type RequestWithContext } from '../../../common/types/request-context';
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  type AccessTokenPayload,
} from '../auth.constants';

/**
 * Exige un access token válido (`Authorization: Bearer <jwt>`) y publica la
 * identidad en `request.user`. Es el ÚNICO punto que asigna `request.user`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token, {
        algorithms: ['HS256'],
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
      });
      request.user = { id: payload.sub, email: payload.email, sessionId: payload.sid };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
