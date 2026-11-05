import { Injectable } from '@nestjs/common';
import { type EntityManager } from 'typeorm';
import { AuditRepository } from './audit.repository';

export interface AuditEntry {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  tenantId?: string | null;
  actorUserId?: string | null;
  /** Contexto adicional. NUNCA incluir contraseñas, tokens ni contenido clínico. */
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const MAX_USER_AGENT_LENGTH = 512;

/**
 * Servicio de auditoría reutilizable por cualquier módulo.
 * Los errores se propagan: una operación auditable no debe completarse
 * silenciosamente si su registro de auditoría falla.
 */
@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  /** Con `manager`, el registro se confirma o se revierte junto con esa transacción. */
  record(entry: AuditEntry, manager?: EntityManager): Promise<void> {
    return this.auditRepository.insert(
      {
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        tenantId: entry.tenantId ?? null,
        actorUserId: entry.actorUserId ?? null,
        metadata: entry.metadata ?? {},
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
      },
      manager,
    );
  }
}
