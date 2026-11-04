import { describe, expect, it } from 'vitest';
import { assertNever, isUuid, normalizeEmail, parseList } from './index.js';

describe('isUuid', () => {
  it('acepta UUID válidos', () => {
    expect(isUuid('3f1c2b7e-8d4a-4f6b-9c1e-2a3b4c5d6e7f')).toBe(true);
  });

  it('rechaza valores que no son UUID', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('')).toBe(false);
    expect(isUuid(123)).toBe(false);
    expect(isUuid("3f1c2b7e-8d4a-4f6b-9c1e-2a3b4c5d6e7f' OR 1=1")).toBe(false);
  });
});

describe('normalizeEmail', () => {
  it('elimina espacios y pasa a minúsculas', () => {
    expect(normalizeEmail('  Ana.Perez@Example.COM ')).toBe('ana.perez@example.com');
  });
});

describe('parseList', () => {
  it('divide, recorta y elimina vacíos y duplicados', () => {
    expect(parseList(' http://a.test, ,http://b.test,http://a.test ')).toEqual([
      'http://a.test',
      'http://b.test',
    ]);
  });

  it('devuelve lista vacía para valores ausentes', () => {
    expect(parseList(undefined)).toEqual([]);
    expect(parseList('')).toEqual([]);
  });
});

describe('assertNever', () => {
  it('lanza un error si se alcanza en tiempo de ejecución', () => {
    expect(() => assertNever('x' as never)).toThrowError(/x/);
  });
});
