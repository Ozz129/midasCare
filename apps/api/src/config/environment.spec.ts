import { EnvironmentValidationError, loadAppConfig } from './environment';

const validEnv = {
  NODE_ENV: 'development',
  API_PORT: '3000',
  API_PUBLIC_URL: 'http://localhost:3000',
  CORS_ORIGINS: 'http://localhost:5173, https://app.midascare.test',
  DATABASE_URL: 'postgres://user:secret-password@localhost:5432/midas_care',
  AUTH_ACCESS_TOKEN_SECRET: 'spec-only-secret-0123456789abcdefghijklmno',
};

describe('loadAppConfig', () => {
  it('construye una configuración tipada a partir de un entorno válido', () => {
    const config = loadAppConfig(validEnv);

    expect(config).toEqual({
      nodeEnv: 'development',
      port: 3000,
      publicUrl: 'http://localhost:3000',
      corsOrigins: ['http://localhost:5173', 'https://app.midascare.test'],
      swaggerEnabled: true,
      database: {
        url: validEnv.DATABASE_URL,
        ssl: false,
        logging: false,
        retryAttempts: 3,
      },
      storage: { driver: 'local', localPath: './storage' },
      auth: {
        accessTokenSecret: validEnv.AUTH_ACCESS_TOKEN_SECRET,
        accessTokenTtlSeconds: 900,
        refreshTokenTtlSeconds: 2_592_000,
        secureCookies: false,
      },
    });
  });

  it('exige un secreto de access token de al menos 32 caracteres', () => {
    expect(() => loadAppConfig({ ...validEnv, AUTH_ACCESS_TOKEN_SECRET: undefined })).toThrow(
      EnvironmentValidationError,
    );
    expect(() => loadAppConfig({ ...validEnv, AUTH_ACCESS_TOKEN_SECRET: 'corto' })).toThrow(
      /AUTH_ACCESS_TOKEN_SECRET/,
    );
  });

  it('usa cookies Secure en staging y production', () => {
    expect(loadAppConfig({ ...validEnv, NODE_ENV: 'staging' }).auth.secureCookies).toBe(true);
    expect(loadAppConfig({ ...validEnv, NODE_ENV: 'production' }).auth.secureCookies).toBe(true);
  });

  it('deshabilita Swagger por defecto fuera de development', () => {
    expect(loadAppConfig({ ...validEnv, NODE_ENV: 'production' }).swaggerEnabled).toBe(false);
    expect(
      loadAppConfig({ ...validEnv, NODE_ENV: 'staging', SWAGGER_ENABLED: 'true' }).swaggerEnabled,
    ).toBe(true);
  });

  it('interpreta booleanos de forma estricta', () => {
    expect(loadAppConfig({ ...validEnv, DATABASE_SSL: 'false' }).database.ssl).toBe(false);
    expect(loadAppConfig({ ...validEnv, DATABASE_SSL: 'TRUE' }).database.ssl).toBe(true);
    expect(() => loadAppConfig({ ...validEnv, DATABASE_SSL: 'yes' })).toThrow(
      EnvironmentValidationError,
    );
  });

  it.each([
    ['DATABASE_URL ausente', { DATABASE_URL: undefined }],
    ['DATABASE_URL con protocolo incorrecto', { DATABASE_URL: 'mysql://localhost/db' }],
    ['puerto fuera de rango', { API_PORT: '70000' }],
    ['NODE_ENV desconocido', { NODE_ENV: 'qa' }],
    ['CORS con comodín', { CORS_ORIGINS: '*' }],
    ['CORS con ruta', { CORS_ORIGINS: 'http://localhost:5173/app' }],
    ['driver de almacenamiento no soportado', { STORAGE_DRIVER: 's3' }],
  ])('rechaza configuración inválida: %s', (_case, overrides) => {
    expect(() => loadAppConfig({ ...validEnv, ...overrides })).toThrow(EnvironmentValidationError);
  });

  it('no incluye valores (posibles secretos) en el mensaje de error', () => {
    try {
      loadAppConfig({ ...validEnv, DATABASE_URL: 'mysql://user:super-secret@host/db' });
      throw new Error('debería haber fallado');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentValidationError);
      expect((error as Error).message).toContain('DATABASE_URL');
      expect((error as Error).message).not.toContain('super-secret');
    }
  });
});
