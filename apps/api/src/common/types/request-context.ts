import { type MembershipRole } from '@care/api-contracts';
import { type Request } from 'express';

/**
 * Identidad autenticada asociada a la petición.
 * La establece EXCLUSIVAMENTE JwtAuthGuard (AuthModule). Ningún otro código debe asignarla.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  /** Sesión (auth_sessions) que emitió el access token. */
  sessionId?: string;
}

/** Contexto de tenant validado contra la membresía activa del usuario. */
export interface TenantContext {
  tenantId: string;
  userId: string;
  membershipId: string;
  role: MembershipRole;
}

export interface RequestWithContext extends Request {
  user?: AuthenticatedUser;
  tenantContext?: TenantContext;
}
