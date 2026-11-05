/**
 * Seguridad del perfil propio (/users/me): autenticación obligatoria, aislamiento entre
 * usuarios, validación del formato real de las imágenes y límites de tamaño.
 * Contra PostgreSQL real: requiere TEST_DATABASE_URL (base con migraciones). Sin ella, se omite.
 */
import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  AVATAR_MAX_BYTES,
  type AuthSessionResponse,
  type MyProfileResponse,
  SIGNATURE_MAX_BYTES,
} from '@care/api-contracts';
import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { type AppConfig } from '../src/config/environment';
import { ACCESS_TOKEN_AUDIENCE, ACCESS_TOKEN_ISSUER } from '../src/core/auth/auth.constants';
import { createTestConfig } from './test-config';

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

const ME = '/api/v1/users/me';
const IMAGE_KINDS = ['avatar', 'signature'] as const;
type ImageKind = (typeof IMAGE_KINDS)[number];
const MAX_BYTES: Record<ImageKind, number> = {
  avatar: AVATAR_MAX_BYTES,
  signature: SIGNATURE_MAX_BYTES,
};

/** PNG válido de 1x1 píxel. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
/** Cabeceras mínimas reconocibles de JPEG y WebP. */
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x24, 0, 0, 0]),
  Buffer.from('WEBPVP8 '),
  Buffer.alloc(64),
]);

/** Contenidos que NO son imágenes permitidas, aunque se presenten como tales. */
const DISALLOWED: ReadonlyArray<[string, Buffer]> = [
  [
    'SVG con script',
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
  ],
  ['HTML', Buffer.from('<!doctype html><html><script>alert(1)</script></html>')],
  ['GIF', Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(32)])],
  ['PDF', Buffer.from('%PDF-1.7\n%âãÏÓ\n1 0 obj\n')],
  ['ejecutable (ELF)', Buffer.concat([Buffer.from([0x7f, 0x45, 0x4c, 0x46]), Buffer.alloc(32)])],
  ['PNG truncado (firma incompleta)', PNG.subarray(0, 7)],
  [
    'RIFF que no es WebP (WAV)',
    Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE'), Buffer.alloc(16)]),
  ],
];

/** PNG válido rellenado hasta exactamente `size` bytes. */
function pngOfSize(size: number): Buffer {
  return Buffer.concat([PNG, Buffer.alloc(size - PNG.length)]);
}

interface TestUser {
  id: string;
  token: string;
}

describeWithDatabase('Seguridad del perfil propio (e2e, con PostgreSQL)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let config: AppConfig;
  let storageDir: string;
  let alice: TestUser;
  let bob: TestUser;

  const as = (user: TestUser) => ({ Authorization: `Bearer ${user.token}` });

  /** Archivos guardados para un usuario en el almacenamiento privado (users/<id>/...). */
  async function storedFiles(userId: string): Promise<string[]> {
    try {
      return (await readdir(join(storageDir, 'users', userId))).sort();
    } catch {
      return [];
    }
  }

  async function register(givenName: string, licenseNumber: string): Promise<TestUser> {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({
        email: `seguridad-${randomUUID()}@midascare.test`,
        password: 'una-contraseña-segura-123',
        givenName,
        familyName: 'Prueba',
        specialty: 'PSYCHOLOGY',
        licenseNumber,
      })
      .expect(201);
    const session = response.body as AuthSessionResponse;
    return { id: session.user.id, token: session.accessToken };
  }

  /** Firma un JWT con los parámetros indicados (por defecto, idénticos a los de la API). */
  function signToken(
    payload: Record<string, unknown>,
    overrides: { secret?: string; issuer?: string; audience?: string; expiresIn?: number } = {},
  ): string {
    return new JwtService().sign(payload, {
      secret: overrides.secret ?? config.auth.accessTokenSecret,
      algorithm: 'HS256',
      issuer: overrides.issuer ?? ACCESS_TOKEN_ISSUER,
      audience: overrides.audience ?? ACCESS_TOKEN_AUDIENCE,
      expiresIn: overrides.expiresIn ?? 300,
    });
  }

  beforeAll(async () => {
    storageDir = await mkdtemp(join(tmpdir(), 'midas-care-e2e-security-'));
    config = createTestConfig({
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

    alice = await register('Alicia', 'COP-ALICIA');
    bob = await register('Bruno', 'COP-BRUNO');
  }, 30_000);

  afterAll(async () => {
    await app?.close();
    await rm(storageDir, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------------------
  describe('autenticación obligatoria', () => {
    const endpoints: ReadonlyArray<[string, string]> = [
      ['GET', ME],
      ['PATCH', ME],
      ...IMAGE_KINDS.flatMap((kind): Array<[string, string]> => [
        ['GET', `${ME}/${kind}`],
        ['PUT', `${ME}/${kind}`],
        ['DELETE', `${ME}/${kind}`],
      ]),
    ];

    function send(method: string, path: string, headers: Record<string, string> = {}) {
      const call =
        request(server)[method.toLowerCase() as 'get' | 'patch' | 'put' | 'delete'](path);
      call.set(headers);
      if (method === 'PUT') return call.attach('file', PNG, 'imagen.png');
      if (method === 'PATCH') return call.send({ givenName: 'Intruso' });
      return call;
    }

    it.each(endpoints)('%s %s sin token responde 401', async (method, path) => {
      const response = await send(method, path).expect(401);
      expect(response.body).toMatchObject({ statusCode: 401, path });
    });

    const invalidHeaders: ReadonlyArray<[string, () => string]> = [
      ['esquema distinto de Bearer', () => `Basic ${alice.token}`],
      ['Bearer sin token', () => 'Bearer'],
      ['token mal formado', () => 'Bearer no-es-un-jwt'],
      [
        'firma con otro secreto',
        () =>
          `Bearer ${signToken({ sub: alice.id, email: 'x', sid: randomUUID() }, { secret: 'otro-secreto-de-al-menos-32-caracteres!!' })}`,
      ],
      [
        'emisor incorrecto',
        () =>
          `Bearer ${signToken({ sub: alice.id, email: 'x', sid: randomUUID() }, { issuer: 'otro-emisor' })}`,
      ],
      [
        'audiencia incorrecta',
        () =>
          `Bearer ${signToken({ sub: alice.id, email: 'x', sid: randomUUID() }, { audience: 'otra-app' })}`,
      ],
      [
        'token caducado',
        () =>
          `Bearer ${signToken({ sub: alice.id, email: 'x', sid: randomUUID(), iat: Math.floor(Date.now() / 1000) - 600 }, { expiresIn: 60 })}`,
      ],
      [
        'algoritmo "none" (sin firma)',
        () => {
          const encode = (value: object) =>
            Buffer.from(JSON.stringify(value)).toString('base64url');
          const now = Math.floor(Date.now() / 1000);
          return `Bearer ${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: alice.id, email: 'x', sid: randomUUID(), iss: ACCESS_TOKEN_ISSUER, aud: ACCESS_TOKEN_AUDIENCE, iat: now, exp: now + 300 })}.`;
        },
      ],
      [
        'firma de Alicia sobre un payload alterado (sub de Bruno)',
        () => {
          const [header, , signature] = alice.token.split('.');
          const payload = JSON.parse(
            Buffer.from(alice.token.split('.')[1] ?? '', 'base64url').toString(),
          ) as Record<string, unknown>;
          const tampered = Buffer.from(JSON.stringify({ ...payload, sub: bob.id })).toString(
            'base64url',
          );
          return `Bearer ${header}.${tampered}.${signature}`;
        },
      ],
    ];

    it.each(invalidHeaders)('rechaza con 401: %s', async (_case, header) => {
      for (const [method, path] of endpoints) {
        await send(method, path, { Authorization: header() }).expect(401);
      }
      // Ningún intento inválido modificó el perfil de Alicia.
      const profile = await request(server).get(ME).set(as(alice)).expect(200);
      expect((profile.body as MyProfileResponse).user.givenName).toBe('Alicia');
    });

    it('no acepta el token por query string ni por cookie', async () => {
      await request(server).get(`${ME}?access_token=${alice.token}`).expect(401);
      await request(server).get(ME).set('Cookie', `access_token=${alice.token}`).expect(401);
    });

    it('un token bien firmado de un usuario inexistente responde 401 (no 500)', async () => {
      const ghost = signToken({
        sub: randomUUID(),
        email: 'fantasma@midascare.test',
        sid: randomUUID(),
      });
      for (const [method, path] of endpoints) {
        await send(method, path, { Authorization: `Bearer ${ghost}` }).expect(401);
      }
    });
  });

  // ---------------------------------------------------------------------------
  describe('aislamiento entre usuarios', () => {
    beforeAll(async () => {
      for (const kind of IMAGE_KINDS) {
        await request(server)
          .put(`${ME}/${kind}`)
          .set(as(alice))
          .attach('file', PNG, 'a.png')
          .expect(200);
      }
    });

    it('cada token solo ve su propio perfil', async () => {
      const [aliceProfile, bobProfile] = await Promise.all([
        request(server).get(ME).set(as(alice)).expect(200),
        request(server).get(ME).set(as(bob)).expect(200),
      ]);
      const a = aliceProfile.body as MyProfileResponse;
      const b = bobProfile.body as MyProfileResponse;
      expect(a.user.id).toBe(alice.id);
      expect(a.professional?.licenseNumber).toBe('COP-ALICIA');
      expect(a.user.hasAvatar).toBe(true);
      expect(b.user.id).toBe(bob.id);
      expect(b.professional).toMatchObject({
        userId: bob.id,
        licenseNumber: 'COP-BRUNO',
        hasSignature: false,
      });
      expect(b.user.hasAvatar).toBe(false);
    });

    it('un usuario no puede obtener las imágenes de otro', async () => {
      for (const kind of IMAGE_KINDS) {
        await request(server).get(`${ME}/${kind}`).set(as(bob)).expect(404);
        await request(server).get(`${ME}/${kind}`).set(as(alice)).expect(200);
      }
      // No hay rutas que reciban un id: no se puede pedir la imagen de otro usuario.
      await request(server).get(`/api/v1/users/${alice.id}/avatar`).set(as(bob)).expect(404);
      await request(server).get(`/api/v1/users/${alice.id}`).set(as(bob)).expect(404);
    });

    it('actualizar o borrar con un token no afecta a otro usuario', async () => {
      await request(server)
        .patch(ME)
        .set(as(bob))
        .send({ givenName: 'Bruno Editado', licenseNumber: 'COP-NUEVA' })
        .expect(200);
      for (const kind of IMAGE_KINDS) {
        await request(server).delete(`${ME}/${kind}`).set(as(bob)).expect(200);
      }

      const a = (await request(server).get(ME).set(as(alice)).expect(200))
        .body as MyProfileResponse;
      expect(a.user.givenName).toBe('Alicia');
      expect(a.professional).toMatchObject({ licenseNumber: 'COP-ALICIA', hasSignature: true });
      expect(a.user.hasAvatar).toBe(true);
      for (const kind of IMAGE_KINDS) {
        await request(server).get(`${ME}/${kind}`).set(as(alice)).expect(200);
      }
    });

    it.each([
      ['id', { id: randomUUID() }],
      ['userId', { userId: randomUUID() }],
      ['email', { email: 'otro@midascare.test' }],
      ['status', { status: 'DISABLED' }],
      ['avatarStorageKey', { avatarStorageKey: 'users/otro/avatar' }],
      ['signatureStorageKey', { signatureStorageKey: '../../etc/passwd' }],
    ])('PATCH rechaza el campo no permitido "%s" (400)', async (_field, body) => {
      await request(server).patch(ME).set(as(bob)).send(body).expect(400);
    });

    it('las imágenes se guardan bajo la carpeta privada de su dueño', async () => {
      const aliceFiles = await storedFiles(alice.id);
      expect(aliceFiles).toHaveLength(2);
      expect(aliceFiles.some((name) => name.startsWith('avatar-'))).toBe(true);
      expect(aliceFiles.some((name) => name.startsWith('signature-'))).toBe(true);
      // Bruno borró las suyas: no le queda ningún archivo.
      expect(await storedFiles(bob.id)).toEqual([]);
    });

    it('las respuestas nunca exponen claves de almacenamiento ni contraseñas', async () => {
      const responses = await Promise.all([
        request(server).get(ME).set(as(alice)),
        request(server).patch(ME).set(as(alice)).send({ displayName: 'Ps. Alicia' }),
        request(server).put(`${ME}/avatar`).set(as(alice)).attach('file', PNG, 'a.png'),
      ]);
      for (const response of responses) {
        expect(response.status).toBe(200);
        expect(JSON.stringify(response.body)).not.toMatch(/storage|password|users\//i);
      }
    });
  });

  // ---------------------------------------------------------------------------
  describe.each(IMAGE_KINDS)('formato de imagen (%s)', (kind) => {
    const path = `${ME}/${kind}`;

    it.each([
      ['PNG', PNG, 'image/png'],
      ['JPEG', JPEG, 'image/jpeg'],
      ['WebP', WEBP, 'image/webp'],
    ] as const)(
      'acepta %s y lo sirve con el tipo detectado por su contenido',
      async (_name, content, mime) => {
        // El cliente declara otro tipo y otra extensión: se ignoran.
        await request(server)
          .put(path)
          .set(as(bob))
          .attach('file', content, { filename: 'imagen.gif', contentType: 'image/gif' })
          .expect(200);
        const served = await request(server).get(path).set(as(bob)).expect(200);
        expect(served.headers['content-type']).toBe(mime);
        expect(served.headers['x-content-type-options']).toBe('nosniff');
        expect(served.headers['cache-control']).toBe('private, no-store');
        expect(served.headers['content-disposition']).toBe('inline');
        expect(Buffer.compare(served.body as Buffer, content)).toBe(0);
      },
    );

    it.each(DISALLOWED)(
      'rechaza %s aunque se declare como image/png (400) y conserva la imagen anterior',
      async (_name, content) => {
        await request(server).put(path).set(as(bob)).attach('file', PNG, 'buena.png').expect(200);
        const filesBefore = await storedFiles(bob.id);

        const rejected = await request(server)
          .put(path)
          .set(as(bob))
          .attach('file', content, { filename: 'imagen.png', contentType: 'image/png' })
          .expect(400);
        expect(rejected.body.message).toMatch(/PNG, JPG o WebP/);

        const served = await request(server).get(path).set(as(bob)).expect(200);
        expect(Buffer.compare(served.body as Buffer, PNG)).toBe(0);
        // No queda ningún archivo huérfano del intento rechazado.
        expect(await storedFiles(bob.id)).toEqual(filesBefore);
      },
    );

    it('rechaza un archivo vacío o ausente (400)', async () => {
      await request(server)
        .put(path)
        .set(as(bob))
        .attach('file', Buffer.alloc(0), 'vacia.png')
        .expect(400);
      await request(server).put(path).set(as(bob)).expect(400);
      await request(server)
        .put(path)
        .set(as(bob))
        .send({ file: PNG.toString('base64') })
        .expect(400);
    });

    it('rechaza el archivo en un campo distinto de "file" (400)', async () => {
      await request(server).put(path).set(as(bob)).attach('imagen', PNG, 'a.png').expect(400);
    });

    it('rechaza más de un archivo o campos adicionales (400)', async () => {
      await request(server)
        .put(path)
        .set(as(bob))
        .attach('file', PNG, 'a.png')
        .attach('file', PNG, 'b.png')
        .expect(400);
      await request(server)
        .put(path)
        .set(as(bob))
        .field('userId', alice.id)
        .attach('file', PNG, 'a.png')
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  describe.each(IMAGE_KINDS)('límite de tamaño (%s)', (kind) => {
    const path = `${ME}/${kind}`;
    const max = MAX_BYTES[kind];

    it(`acepta una imagen de exactamente el máximo (${max} bytes)`, async () => {
      await request(server)
        .put(path)
        .set(as(bob))
        .attach('file', pngOfSize(max), 'max.png')
        .expect(200);
    });

    it('rechaza con 413 una imagen de un byte más que el máximo, sin guardar nada', async () => {
      await request(server).put(path).set(as(bob)).attach('file', PNG, 'buena.png').expect(200);
      const filesBefore = await storedFiles(bob.id);

      const rejected = await request(server)
        .put(path)
        .set(as(bob))
        .attach('file', pngOfSize(max + 1), 'grande.png')
        .expect(413);
      expect(rejected.body).toMatchObject({ statusCode: 413, path });

      const served = await request(server).get(path).set(as(bob)).expect(200);
      expect(Buffer.compare(served.body as Buffer, PNG)).toBe(0);
      expect(await storedFiles(bob.id)).toEqual(filesBefore);
    });

    it('rechaza con 413 un archivo muy superior al máximo', async () => {
      await request(server)
        .put(path)
        .set(as(bob))
        .attach('file', pngOfSize(max * 3), 'enorme.png')
        .expect(413);
    });
  });

  it('cada tipo de imagen tiene su propio límite (la firma es menor que la foto)', async () => {
    expect(SIGNATURE_MAX_BYTES).toBeLessThan(AVATAR_MAX_BYTES);
    const between = pngOfSize(SIGNATURE_MAX_BYTES + 1);
    await request(server)
      .put(`${ME}/avatar`)
      .set(as(bob))
      .attach('file', between, 'a.png')
      .expect(200);
    await request(server)
      .put(`${ME}/signature`)
      .set(as(bob))
      .attach('file', between, 'f.png')
      .expect(413);
  });

  it('PATCH rechaza cuerpos JSON excesivos (413) y textos que superan los límites (400)', async () => {
    await request(server)
      .patch(ME)
      .set(as(bob))
      .send({ displayName: 'x'.repeat(200 * 1024) })
      .expect(413);
    await request(server)
      .patch(ME)
      .set(as(bob))
      .send({ givenName: 'x'.repeat(101) })
      .expect(400);
    await request(server)
      .patch(ME)
      .set(as(bob))
      .send({ displayName: 'x'.repeat(201) })
      .expect(400);
    await request(server)
      .patch(ME)
      .set(as(bob))
      .send({ licenseNumber: 'x'.repeat(101) })
      .expect(400);
    await request(server).patch(ME).set(as(bob)).send({ givenName: '   ' }).expect(400);
  });
});
