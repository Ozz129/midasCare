import { PasswordHasher } from './password-hasher';

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher();

  it('genera un hash verificable que no contiene la contraseña', async () => {
    const hash = await hasher.hash('una-contraseña-larga');

    expect(hash).toMatch(/^scrypt\$65536\$8\$1\$[\w-]+\$[\w-]+$/);
    expect(hash).not.toContain('una-contraseña-larga');
    await expect(hasher.verify('una-contraseña-larga', hash)).resolves.toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const hash = await hasher.hash('correcta-123456');
    await expect(hasher.verify('incorrecta-123456', hash)).resolves.toBe(false);
  });

  it('usa una sal distinta en cada hash', async () => {
    const [a, b] = await Promise.all([hasher.hash('misma-clave-1'), hasher.hash('misma-clave-1')]);
    expect(a).not.toBe(b);
  });

  it.each(['', 'texto-plano', 'bcrypt$x$y', 'scrypt$abc$8$1$c2FsdA$aGFzaA'])(
    'nunca valida un hash con formato inválido: %p',
    async (stored) => {
      await expect(hasher.verify('lo-que-sea', stored)).resolves.toBe(false);
    },
  );
});
