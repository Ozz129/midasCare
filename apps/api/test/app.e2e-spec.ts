/**
 * Arranque completo de la aplicación (AppModule real + PostgreSQL).
 *
 * Requiere una base de datos PostgreSQL accesible y con las migraciones aplicadas:
 *   TEST_DATABASE_URL=postgres://user:pass@localhost:5432/midas_care_test pnpm --filter @care/api test
 *
 * Si TEST_DATABASE_URL no está definida, la suite se omite (no se asume ningún servicio externo).
 */
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { createTestConfig } from './test-config';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('AppModule (e2e, con PostgreSQL)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const config = createTestConfig({ DATABASE_URL: databaseUrl ?? '' });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(config)],
    }).compile();

    app = moduleRef.createNestApplication({ logger: ['error'] });
    configureApp(app, config);
    await app.init();
  }, 30_000);

  afterAll(async () => {
    await app?.close();
  });

  it('inicia con configuración válida y conecta a PostgreSQL', async () => {
    const dataSource = app.get(DataSource);
    expect(dataSource.isInitialized).toBe(true);

    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(response.body).toMatchObject({ status: 'ok', checks: { database: 'up' } });
  });

  it('el esquema Core existe (migraciones aplicadas) y usa la convención snake_case', async () => {
    const dataSource = app.get(DataSource);
    const rows: Array<{ table_name: string }> = await dataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
    );
    expect(rows.map((row) => row.table_name)).toEqual(
      expect.arrayContaining([
        'audit_logs',
        'memberships',
        'professional_profiles',
        'stored_files',
        'tenants',
        'users',
      ]),
    );
  });
});
