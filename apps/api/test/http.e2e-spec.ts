/**
 * Pruebas e2e del pipeline HTTP SIN base de datos:
 * se usa el mismo configureApp() que main.ts, con un DataSource simulado.
 */
import { type HealthResponse } from '@care/api-contracts';
import { Global, type INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { configureApp } from '../src/app.setup';
import { AppConfigModule } from '../src/config/app-config.module';
import { HealthModule } from '../src/health/health.module';
import { createTestConfig } from './test-config';

const dataSourceMock = {
  isInitialized: true,
  query: jest.fn(),
};

@Global()
@Module({
  providers: [{ provide: DataSource, useValue: dataSourceMock }],
  exports: [DataSource],
})
class FakeDatabaseModule {}

describe('Pipeline HTTP (e2e, sin base de datos)', () => {
  let app: INestApplication;
  const config = createTestConfig();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppConfigModule.forRoot(config), FakeDatabaseModule, HealthModule],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app, config);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    dataSourceMock.query.mockReset();
  });

  it('GET /api/v1/health responde 200 con base de datos disponible', async () => {
    dataSourceMock.query.mockResolvedValue([{ '?column?': 1 }]);

    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    const body = response.body as HealthResponse;

    expect(body).toMatchObject({
      status: 'ok',
      service: 'midas-care-api',
      environment: 'test',
      checks: { database: 'up' },
    });
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('GET /api/v1/health informa "degraded" si la base de datos no responde', async () => {
    dataSourceMock.query.mockRejectedValue(new Error('connection refused'));

    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(response.body).toMatchObject({ status: 'degraded', checks: { database: 'down' } });
    expect(JSON.stringify(response.body)).not.toContain('connection refused');
  });

  it('aplica cabeceras de seguridad (helmet)', async () => {
    dataSourceMock.query.mockResolvedValue([]);
    const response = await request(app.getHttpServer()).get('/api/v1/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('permite CORS solo a los orígenes configurados', async () => {
    dataSourceMock.query.mockResolvedValue([]);

    const allowed = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const denied = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('las rutas inexistentes devuelven el formato de error estándar', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/does-not-exist?token=secret')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      error: 'NOT_FOUND',
      path: '/api/v1/does-not-exist',
    });
    expect(JSON.stringify(response.body)).not.toContain('secret');
  });

  it('los endpoints previstos y no implementados no existen', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/tenants/3f1c2b7e-8d4a-4f6b-9c1e-2a3b4c5d6e7f')
      .expect(404);
  });

  it('el endpoint sin prefijo no existe', async () => {
    await request(app.getHttpServer()).get('/health').expect(404);
  });

  it('Swagger documenta únicamente endpoints implementados', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    const paths = Object.keys((response.body as { paths: Record<string, unknown> }).paths);

    expect(paths).toEqual(['/api/v1/health']);
  });
});
