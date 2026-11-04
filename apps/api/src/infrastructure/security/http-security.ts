import { type INestApplication } from '@nestjs/common';
import { type CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { TENANT_HEADER } from '@care/api-contracts';
import helmet from 'helmet';
import { type AppConfig } from '../../config/environment';

/** CORS explícito: solo los orígenes declarados en CORS_ORIGINS. */
export function buildCorsOptions(config: AppConfig): CorsOptions {
  const allowed = new Set(config.corsOrigins);
  return {
    origin: (origin, callback) => {
      // Peticiones sin cabecera Origin (curl, health checks, server-to-server) no son CORS.
      callback(null, origin === undefined || allowed.has(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', TENANT_HEADER],
    maxAge: 600,
  };
}

/** Cabeceras de seguridad HTTP y CORS. */
export function applyHttpSecurity(app: INestApplication, config: AppConfig): void {
  app.use(helmet());
  app.enableCors(buildCorsOptions(config));
}
