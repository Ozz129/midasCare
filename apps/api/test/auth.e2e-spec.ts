/**
 * Flujo completo de autenticación contra PostgreSQL real (AppModule completo).
 * Requiere TEST_DATABASE_URL apuntando a una base con las migraciones aplicadas.
 * Sin TEST_DATABASE_URL la suite se omite.
 */
import { randomUUID } from 'node:crypto';
import { type AuthSessionResponse, type UserTenantResponse } from '@care/api-contracts';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { createTestConfig } from './test-config';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

function refreshCookie(response: request.Response): string | undefined {
  const raw = response.headers['set-cookie'] as unknown as string[] | undefined;
  return raw?.find((cookie) => cookie.startsWith('mc_refresh='));
}

function cookiePair(setCookie: string | undefined): string {
  return (setCookie ?? '').split(';')[0] ?? '';
}

describeWithDatabase('Autenticación (e2e, con PostgreSQL)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  const email = `e2e-${randomUUID()}@midascare.test`;
  const password = 'una-contraseña-segura-123';

  beforeAll(async () => {
    const config = createTestConfig({ DATABASE_URL: databaseUrl ?? '' });
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.register(config)],
    }).compile();
    app = moduleRef.createNestApplication({ logger: ['error'] });
    configureApp(app, config);
    await app.init();
    server = app.getHttpServer();
  }, 30_000);

  afterAll(async () => {
    await app?.close();
  });

  it('registra un usuario con su espacio individual y entrega la cookie de sesión', async () => {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ email: ` ${email.toUpperCase()} `, password, givenName: 'Ana', familyName: 'Pérez' })
      .expect(201);

    const body = response.body as AuthSessionResponse;
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.expiresIn).toBe(900);
    expect(body.user).toMatchObject({
      email,
      givenName: 'Ana',
      familyName: 'Pérez',
      status: 'ACTIVE',
    });
    expect(JSON.stringify(body)).not.toMatch(/password/i);
    expect(response.headers['cache-control']).toBe('no-store');

    const cookie = refreshCookie(response);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
  });

  it('rechaza un correo ya registrado y contraseñas cortas', async () => {
    await request(server)
      .post('/api/v1/auth/register')
      .send({ email, password, givenName: 'Otra', familyName: 'Persona' })
      .expect(409);
    await request(server)
      .post('/api/v1/auth/register')
      .send({ email: `x-${email}`, password: 'corta', givenName: 'A', familyName: 'B' })
      .expect(400);
  });

  it('guarda la contraseña solo como hash scrypt', async () => {
    const rows: Array<{ password_hash: string }> = await app
      .get(DataSource)
      .query('SELECT password_hash FROM users WHERE email = $1', [email]);
    expect(rows[0]?.password_hash).toMatch(/^scrypt\$/);
    expect(rows[0]?.password_hash).not.toContain(password);
  });

  it('responde lo mismo ante contraseña incorrecta o correo inexistente', async () => {
    const wrong = await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password: 'contraseña-incorrecta' })
      .expect(401);
    const unknown = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: `nadie-${email}`, password })
      .expect(401);

    expect(wrong.body.message).toBe('Correo o contraseña incorrectos.');
    expect(unknown.body.message).toBe(wrong.body.message);
    expect(refreshCookie(wrong)).toBeUndefined();
  });

  it('login → me → tenants → refresh (rotación) → logout', async () => {
    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const { accessToken } = login.body as AuthSessionResponse;
    const firstCookie = cookiePair(refreshCookie(login));

    // Perfil con access token válido; sin token o manipulado -> 401.
    const me = await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(me.body).toMatchObject({ email });
    await request(server).get('/api/v1/auth/me').expect(401);
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken.slice(0, -2)}xx`)
      .expect(401);

    // Espacio de trabajo individual creado en el registro.
    const tenants = await request(server)
      .get('/api/v1/tenants')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const list = tenants.body as UserTenantResponse[];
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      role: 'OWNER',
      tenant: { type: 'INDIVIDUAL', name: 'Ana Pérez' },
    });

    // Renovación: emite un nuevo refresh token y el anterior deja de servir.
    const refreshed = await request(server)
      .post('/api/v1/auth/refresh')
      .set('Cookie', firstCookie)
      .expect(200);
    const secondCookie = cookiePair(refreshCookie(refreshed));
    expect(secondCookie).not.toBe(firstCookie);
    expect((refreshed.body as AuthSessionResponse).accessToken).toEqual(expect.any(String));
    await request(server).post('/api/v1/auth/refresh').set('Cookie', firstCookie).expect(401);

    // Cierre de sesión: revoca la sesión vigente.
    await request(server).post('/api/v1/auth/logout').set('Cookie', secondCookie).expect(204);
    await request(server).post('/api/v1/auth/refresh').set('Cookie', secondCookie).expect(401);
  });

  it('sin cookie no hay renovación posible', async () => {
    await request(server).post('/api/v1/auth/refresh').expect(401);
  });

  it('audita accesos y fallos sin registrar contraseñas', async () => {
    const rows: Array<{ action: string; metadata: unknown }> = await app.get(DataSource).query(
      `SELECT a.action, a.metadata FROM audit_logs a
         WHERE a.action LIKE 'auth.%' AND (a.metadata->>'email' = $1 OR a.actor_user_id = (SELECT id FROM users WHERE email = $1))`,
      [email],
    );
    const actions = rows.map((row) => row.action);
    expect(actions).toEqual(
      expect.arrayContaining(['auth.register', 'auth.login', 'auth.login_failed', 'auth.logout']),
    );
    expect(JSON.stringify(rows)).not.toContain(password);
  });
});
