/**
 * Perfil propio (/users/me): datos, especialidades, foto y firma — contra PostgreSQL real.
 * Requiere TEST_DATABASE_URL (base con migraciones aplicadas). Sin ella, se omite.
 */
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type AuthSessionResponse, type MyProfileResponse } from '@care/api-contracts';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { createTestConfig } from './test-config';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

/** PNG válido de 1x1 píxel. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

describeWithDatabase('Perfil propio (e2e, con PostgreSQL)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let storageDir: string;
  let token: string;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'midas-care-e2e-storage-'));
    const config = createTestConfig({
      DATABASE_URL: databaseUrl ?? '',
      STORAGE_LOCAL_PATH: storageDir,
    });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(config)],
    }).compile();
    app = moduleRef.createNestApplication({ logger: ['error'] });
    configureApp(app, config);
    await app.init();
    server = app.getHttpServer();

    const registered = await request(server)
      .post('/api/v1/auth/register')
      .send({
        email: `perfil-${randomUUID()}@midascare.test`,
        password: 'una-contraseña-segura-123',
        givenName: 'Ana',
        familyName: 'Pérez',
        specialty: 'PSYCHOLOGY',
        licenseNumber: 'COP-123',
      })
      .expect(201);
    token = (registered.body as AuthSessionResponse).accessToken;
  }, 30_000);

  afterAll(async () => {
    await app?.close();
    await rm(storageDir, { recursive: true, force: true });
  });

  it('exige autenticación', async () => {
    await request(server).get('/api/v1/users/me').expect(401);
    await request(server).put('/api/v1/users/me/avatar').attach('file', PNG, 'a.png').expect(401);
  });

  it('el registro crea el perfil profesional con la especialidad elegida', async () => {
    const response = await request(server).get('/api/v1/users/me').set(auth()).expect(200);
    const profile = response.body as MyProfileResponse;
    expect(profile.user).toMatchObject({ givenName: 'Ana', hasAvatar: false });
    expect(profile.professional).toMatchObject({
      displayName: 'Ana Pérez',
      licenseNumber: 'COP-123',
      specialties: ['PSYCHOLOGY'],
      hasSignature: false,
    });
    expect(JSON.stringify(profile)).not.toMatch(/storage|password/i);
  });

  it('actualiza datos personales y profesionales', async () => {
    const response = await request(server)
      .patch('/api/v1/users/me')
      .set(auth())
      .send({
        givenName: 'Ana María',
        displayName: 'Ps. Ana María Pérez',
        licenseNumber: '',
        specialties: ['PSYCHOLOGY', 'NEUROPSYCHOLOGY'],
      })
      .expect(200);
    const profile = response.body as MyProfileResponse;
    expect(profile.user.givenName).toBe('Ana María');
    expect(profile.professional).toMatchObject({
      displayName: 'Ps. Ana María Pérez',
      licenseNumber: null,
      specialties: ['PSYCHOLOGY', 'NEUROPSYCHOLOGY'],
    });
  });

  it('rechaza especialidades desconocidas, duplicadas o propiedades no permitidas', async () => {
    await request(server)
      .patch('/api/v1/users/me')
      .set(auth())
      .send({ specialties: ['MAGIA'] })
      .expect(400);
    await request(server)
      .patch('/api/v1/users/me')
      .set(auth())
      .send({ specialties: ['PSYCHOLOGY', 'PSYCHOLOGY'] })
      .expect(400);
    await request(server)
      .patch('/api/v1/users/me')
      .set(auth())
      .send({ email: 'x@y.com' })
      .expect(400);
  });

  it('sube, sirve y elimina la foto de perfil', async () => {
    const uploaded = await request(server)
      .put('/api/v1/users/me/avatar')
      .set(auth())
      .attach('file', PNG, 'foto.png')
      .expect(200);
    expect((uploaded.body as MyProfileResponse).user.hasAvatar).toBe(true);

    const image = await request(server).get('/api/v1/users/me/avatar').set(auth()).expect(200);
    expect(image.headers['content-type']).toBe('image/png');
    expect(image.headers['cache-control']).toBe('private, no-store');
    expect(Buffer.compare(image.body as Buffer, PNG)).toBe(0);

    await request(server).delete('/api/v1/users/me/avatar').set(auth()).expect(200);
    await request(server).get('/api/v1/users/me/avatar').set(auth()).expect(404);
  });

  it('valida el contenido real del archivo (no la extensión)', async () => {
    const rejected = await request(server)
      .put('/api/v1/users/me/avatar')
      .set(auth())
      .attach('file', SVG, { filename: 'foto.png', contentType: 'image/png' })
      .expect(400);
    expect(rejected.body.message).toMatch(/PNG, JPG o WebP/);
    await request(server).put('/api/v1/users/me/avatar').set(auth()).expect(400);
  });

  it('rechaza imágenes que superan el tamaño máximo', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(1024 * 1024 + 10)]);
    await request(server)
      .put('/api/v1/users/me/signature')
      .set(auth())
      .attach('file', big, 'firma.png')
      .expect(413);
  });

  it('sube, reemplaza y elimina la firma', async () => {
    await request(server)
      .put('/api/v1/users/me/signature')
      .set(auth())
      .attach('file', PNG, 'f1.png')
      .expect(200);
    const replaced = await request(server)
      .put('/api/v1/users/me/signature')
      .set(auth())
      .attach('file', PNG, 'f2.png')
      .expect(200);
    expect((replaced.body as MyProfileResponse).professional?.hasSignature).toBe(true);

    const image = await request(server).get('/api/v1/users/me/signature').set(auth()).expect(200);
    expect(image.headers['content-type']).toBe('image/png');

    const deleted = await request(server)
      .delete('/api/v1/users/me/signature')
      .set(auth())
      .expect(200);
    expect((deleted.body as MyProfileResponse).professional?.hasSignature).toBe(false);
    await request(server).get('/api/v1/users/me/signature').set(auth()).expect(404);
  });
});
