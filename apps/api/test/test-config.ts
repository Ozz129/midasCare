import { type AppConfig, loadAppConfig } from '../src/config/environment';

/** Configuración válida para pruebas. No apunta a ninguna base de datos real por defecto. */
export function createTestConfig(overrides: Record<string, string> = {}): AppConfig {
  return loadAppConfig({
    NODE_ENV: 'test',
    API_PORT: '3999',
    API_PUBLIC_URL: 'http://localhost:3999',
    CORS_ORIGINS: 'http://localhost:5173',
    DATABASE_URL: 'postgres://midas_care@localhost:5432/midas_care_test',
    DATABASE_RETRY_ATTEMPTS: '0',
    SWAGGER_ENABLED: 'true',
    // Secreto exclusivo de pruebas (no se usa en ningún entorno real).
    AUTH_ACCESS_TOKEN_SECRET: 'test-only-secret-0123456789abcdefghijklmnop',
    ...overrides,
  });
}
