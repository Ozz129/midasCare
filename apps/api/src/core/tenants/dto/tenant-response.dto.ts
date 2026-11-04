import {
  MembershipRole,
  type TenantResponse,
  TenantStatus,
  TenantType,
  type UserTenantResponse,
} from '@care/api-contracts';
import { ApiProperty } from '@nestjs/swagger';
import { type Membership } from '../../memberships/entities/membership.entity';
import { type Tenant } from '../entities/tenant.entity';

export class TenantResponseDto implements TenantResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: Object.values(TenantType) }) type!: TenantType;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty({ enum: Object.values(TenantStatus) }) status!: TenantStatus;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

export class UserTenantResponseDto implements UserTenantResponse {
  @ApiProperty({ type: TenantResponseDto }) tenant!: TenantResponseDto;
  @ApiProperty({ format: 'uuid' }) membershipId!: string;
  @ApiProperty({ enum: Object.values(MembershipRole) }) role!: MembershipRole;
}

export function toTenantResponse(tenant: Tenant): TenantResponse {
  return {
    id: tenant.id,
    type: tenant.type,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    createdAt: tenant.createdAt.toISOString(),
  };
}

export function toUserTenantResponse(
  membership: Membership & { tenant: Tenant },
): UserTenantResponse {
  return {
    tenant: toTenantResponse(membership.tenant),
    membershipId: membership.id,
    role: membership.role,
  };
}
