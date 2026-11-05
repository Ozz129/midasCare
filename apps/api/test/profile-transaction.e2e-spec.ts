/**
 * Consistencia transaccional de PATCH /users/me (ProfileService.update) contra PostgreSQL real:
 * User, ProfessionalProfile y auditoría se confirman juntos o se revierten juntos.
 * Requiere TEST_DATABASE_URL (base con migraciones aplicadas). Sin ella, se omite.
 */
import { randomUUID } from 'node:crypto';
import { type AuthSessionResponse } from '@care/api-contracts';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { AuditRepository } from '../src/core/audit/audit.repository';
import { AuditLog } from '../src/core/audit/entities/audit-log.entity';
import { ProfessionalProfile } from '../src/core/professionals/entities/professional-profile.entity';
import { ProfessionalsRepository } from '../src/core/professionals/professionals.repository';
import { User } from '../src/core/users/entities/user.entity';
import { createTestConfig } from './test-config';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase('Actualización de perfil transaccional (e2e, con PostgreSQL)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let dataSource: DataSource;
  let professionalsRepository: ProfessionalsRepository;
  let auditRepository: AuditRepository;
  let token: string;
  let userId: string;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  const loadUser = () => dataSource.getRepository(User).findOneByOrFail({ id: userId });
  const loadProfile = () => dataSource.getRepository(ProfessionalProfile).findOneBy({ userId });
  const countProfileAudits = () =>
    dataSource.getRepository(AuditLog).countBy({ action: 'profile.update', resourceId: userId });

  beforeAll(async () => {
    const config = createTestConfig({ DATABASE_URL: databaseUrl ?? '' });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(config)],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app, config);
    await app.init();
    server = app.getHttpServer();
    dataSource = app.get(DataSource);
    professionalsRepository = app.get(ProfessionalsRepository, { strict: false });
    auditRepository = app.get(AuditRepository, { strict: false });

    const registered = await request(server)
      .post('/api/v1/auth/register')
      .send({
        email: `perfil-tx-${randomUUID()}@midascare.test`,
        password: 'una-contraseña-segura-123',
        givenName: 'Ana',
        familyName: 'Pérez',
        specialty: 'PSYCHOLOGY',
        licenseNumber: 'COP-123',
      })
      .expect(201);
    const session = registered.body as AuthSessionResponse;
    token = session.accessToken;
    userId = session.user.id;
  }, 30_000);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('confirma User, ProfessionalProfile y auditoría cuando todo va bien', async () => {
    const auditsBefore = await countProfileAudits();

    await request(server)
      .patch('/api/v1/users/me')
      .set(auth())
      .send({ givenName: 'Ana María', displayName: 'Ps. Ana María Pérez' })
      .expect(200);

    expect((await loadUser()).givenName).toBe('Ana María');
    expect((await loadProfile())?.displayName).toBe('Ps. Ana María Pérez');
    expect(await countProfileAudits()).toBe(auditsBefore + 1);
  });

  it('revierte el cambio de User si falla el guardado del perfil profesional', async () => {
    const userBefore = await loadUser();
    const profileBefore = await loadProfile();
    const auditsBefore = await countProfileAudits();
    jest
      .spyOn(professionalsRepository, 'save')
      .mockRejectedValueOnce(new Error('fallo simulado al guardar el perfil'));

    await request(server)
      .patch('/api/v1/users/me')
      .set(auth())
      .send({ givenName: 'Nombre que no debe persistir', licenseNumber: 'COP-000' })
      .expect(500);

    expect((await loadUser()).givenName).toBe(userBefore.givenName);
    expect((await loadProfile())?.licenseNumber).toBe(profileBefore?.licenseNumber);
    expect(await countProfileAudits()).toBe(auditsBefore);
  });

  it('revierte User y ProfessionalProfile si falla el registro de auditoría', async () => {
    const userBefore = await loadUser();
    const profileBefore = await loadProfile();
    jest
      .spyOn(auditRepository, 'insert')
      .mockRejectedValueOnce(new Error('fallo simulado de auditoría'));

    await request(server)
      .patch('/api/v1/users/me')
      .set(auth())
      .send({ familyName: 'Apellido que no debe persistir', displayName: 'No persiste' })
      .expect(500);

    expect((await loadUser()).familyName).toBe(userBefore.familyName);
    expect((await loadProfile())?.displayName).toBe(profileBefore?.displayName);
  });

  it('no deja creado un perfil profesional nuevo si la operación falla', async () => {
    await dataSource.getRepository(ProfessionalProfile).delete({ userId });
    const userBefore = await loadUser();
    jest
      .spyOn(auditRepository, 'insert')
      .mockRejectedValueOnce(new Error('fallo simulado de auditoría'));

    await request(server)
      .patch('/api/v1/users/me')
      .set(auth())
      .send({ givenName: 'Tampoco persiste', specialties: ['PSYCHOLOGY'] })
      .expect(500);

    expect(await loadProfile()).toBeNull();
    expect((await loadUser()).givenName).toBe(userBefore.givenName);

    // Sin el fallo, la misma petición crea el perfil y aplica todos los cambios.
    await request(server)
      .patch('/api/v1/users/me')
      .set(auth())
      .send({ givenName: 'Ana', specialties: ['PSYCHOLOGY'] })
      .expect(200);
    expect((await loadProfile())?.specialties).toEqual(['PSYCHOLOGY']);
  });
});
