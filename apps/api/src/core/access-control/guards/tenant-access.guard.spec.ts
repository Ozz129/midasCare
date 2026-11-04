import { MembershipRole, MembershipStatus, TENANT_HEADER } from '@care/api-contracts';
import {
  BadRequestException,
  type ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type RequestWithContext } from '../../../common/types/request-context';
import { type MembershipsService } from '../../memberships/memberships.service';
import { TenantAccessGuard } from './tenant-access.guard';

const TENANT_ID = '3f1c2b7e-8d4a-4f6b-9c1e-2a3b4c5d6e7f';
const USER = { id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d', email: 'ana@example.com' };

function createContext(request: Partial<RequestWithContext>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

function createRequest(user?: typeof USER, tenantHeader?: string): Partial<RequestWithContext> {
  return {
    user,
    header: ((name: string) =>
      name.toLowerCase() === TENANT_HEADER
        ? tenantHeader
        : undefined) as RequestWithContext['header'],
  };
}

describe('TenantAccessGuard', () => {
  const findActiveMembership = jest.fn();
  const membershipsService = { findActiveMembership } as unknown as MembershipsService;
  const reflector = new Reflector();
  const guard = new TenantAccessGuard(reflector, membershipsService);

  beforeEach(() => {
    findActiveMembership.mockReset();
    jest.restoreAllMocks();
  });

  it('responde 401 si no hay usuario autenticado (fail-closed)', async () => {
    await expect(
      guard.canActivate(createContext(createRequest(undefined, TENANT_ID))),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(findActiveMembership).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'not-a-uuid'])(
    'responde 400 si la cabecera de tenant es %p',
    async (header) => {
      await expect(
        guard.canActivate(createContext(createRequest(USER, header))),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('responde 403 si el usuario no tiene membresía activa en el tenant', async () => {
    findActiveMembership.mockResolvedValue(null);

    await expect(
      guard.canActivate(createContext(createRequest(USER, TENANT_ID))),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(findActiveMembership).toHaveBeenCalledWith(USER.id, TENANT_ID);
  });

  it('responde 403 si el rol no está permitido', async () => {
    findActiveMembership.mockResolvedValue({
      id: 'm-1',
      tenantId: TENANT_ID,
      role: MembershipRole.STAFF,
      status: MembershipStatus.ACTIVE,
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([MembershipRole.ADMIN]);

    await expect(
      guard.canActivate(createContext(createRequest(USER, TENANT_ID))),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('publica el contexto de tenant validado', async () => {
    findActiveMembership.mockResolvedValue({
      id: 'm-1',
      tenantId: TENANT_ID,
      role: MembershipRole.PROFESSIONAL,
      status: MembershipStatus.ACTIVE,
    });
    const request = createRequest(USER, TENANT_ID);

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.tenantContext).toEqual({
      tenantId: TENANT_ID,
      userId: USER.id,
      membershipId: 'm-1',
      role: MembershipRole.PROFESSIONAL,
    });
  });
});
