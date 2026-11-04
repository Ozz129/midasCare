import type { AppEnvironment, IsoDateTimeString } from '@care/shared-types';

export type HealthStatus = 'ok' | 'degraded';
export type DependencyStatus = 'up' | 'down';

/** Respuesta de `GET /api/v1/health`. */
export interface HealthResponse {
  status: HealthStatus;
  service: string;
  version: string;
  environment: AppEnvironment | 'test';
  timestamp: IsoDateTimeString;
  checks: {
    database: DependencyStatus;
  };
}
