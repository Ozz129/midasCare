import {
  randomBytes,
  scrypt as scryptCallback,
  type ScryptOptions,
  timingSafeEqual,
} from 'node:crypto';
import { Injectable } from '@nestjs/common';

/*
 * Hash de contraseñas con scrypt (node:crypto, sin dependencias nativas).
 * Parámetros: N=2^16, r=8, p=1 (~64 MiB por hash), sal de 16 bytes, clave de 64 bytes.
 * Formato almacenado: scrypt$<N>$<r>$<p>$<sal base64url>$<hash base64url>
 * Los parámetros viajan con el hash, así que pueden endurecerse en el futuro
 * sin invalidar las contraseñas existentes.
 */
const N = 2 ** 16;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function scrypt(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

const memoryFor = (n: number, r: number) => 128 * n * r * 2;

@Injectable()
export class PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const key = await scrypt(password, salt, { N, r: R, p: P, maxmem: memoryFor(N, R) });
    return ['scrypt', N, R, P, salt.toString('base64url'), key.toString('base64url')].join('$');
  }

  /** Comparación en tiempo constante. Un hash con formato inválido nunca valida. */
  async verify(password: string, stored: string): Promise<boolean> {
    const [algorithm, n, r, p, saltB64, keyB64] = stored.split('$');
    if (algorithm !== 'scrypt' || !n || !r || !p || !saltB64 || !keyB64) return false;

    const params = { N: Number(n), r: Number(r), p: Number(p) };
    if (![params.N, params.r, params.p].every(Number.isSafeInteger)) return false;

    const expected = Buffer.from(keyB64, 'base64url');
    const actual = await scrypt(password, Buffer.from(saltB64, 'base64url'), {
      ...params,
      maxmem: memoryFor(params.N, params.r),
    });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
