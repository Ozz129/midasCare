import { generateRefreshToken, hashRefreshToken, readCookie } from './auth.constants';

describe('refresh tokens', () => {
  it('genera tokens aleatorios de 256 bits', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
    expect(Buffer.from(a, 'base64url')).toHaveLength(32);
  });

  it('almacena un hash SHA-256 determinista distinto del token', () => {
    const token = generateRefreshToken();
    expect(hashRefreshToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
    expect(hashRefreshToken(token)).not.toContain(token);
  });
});

describe('readCookie', () => {
  it('extrae la cookie solicitada', () => {
    expect(readCookie('a=1; mc_refresh=abc%2D123; b=2', 'mc_refresh')).toBe('abc-123');
  });

  it('devuelve undefined si no existe o la cabecera falta', () => {
    expect(readCookie('a=1; b=2', 'mc_refresh')).toBeUndefined();
    expect(readCookie(undefined, 'mc_refresh')).toBeUndefined();
  });

  it('no confunde nombres con prefijos comunes', () => {
    expect(readCookie('xmc_refresh=bad; mc_refresh=good', 'mc_refresh')).toBe('good');
  });
});
