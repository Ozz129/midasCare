import { describe, expect, it, vi } from 'vitest';

// env.ts evalúa import.meta.env al importarse; se fija un valor válido para el módulo.
vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api/v1');

const { readWebEnv } = await import('./env');

describe('readWebEnv', () => {
  it('usa la URL local por defecto en development', () => {
    expect(readWebEnv({ DEV: true } as ImportMetaEnv).apiUrl).toBe('http://localhost:3000/api/v1');
  });

  it('exige VITE_API_URL fuera de development', () => {
    expect(() => readWebEnv({ DEV: false } as ImportMetaEnv)).toThrow(/VITE_API_URL/);
  });

  it('normaliza la barra final y valida el esquema', () => {
    expect(
      readWebEnv({ DEV: false, VITE_API_URL: 'https://api.example.com/api/v1/' } as ImportMetaEnv)
        .apiUrl,
    ).toBe('https://api.example.com/api/v1');
    expect(() =>
      readWebEnv({ DEV: false, VITE_API_URL: 'api.example.com' } as ImportMetaEnv),
    ).toThrow();
  });
});
