import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { text } from 'node:stream/consumers';
import { InvalidStorageKeyError, LocalDiskStorageProvider } from './local-disk-storage.provider';

describe('LocalDiskStorageProvider', () => {
  let rootDir: string;
  let storage: LocalDiskStorageProvider;

  beforeEach(async () => {
    rootDir = await mkdtemp(join(tmpdir(), 'midas-care-storage-'));
    storage = new LocalDiskStorageProvider(rootDir);
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it('guarda y lee contenido dentro del directorio raíz', async () => {
    await storage.put('tenants/t1/file-1', Buffer.from('hola'));

    expect(await readFile(join(rootDir, 'tenants', 't1', 'file-1'), 'utf8')).toBe('hola');
    expect(await text(await storage.createReadStream('tenants/t1/file-1'))).toBe('hola');
  });

  it('no sobrescribe una clave existente', async () => {
    await storage.put('a/b', Buffer.from('1'));
    await expect(storage.put('a/b', Buffer.from('2'))).rejects.toThrow();
  });

  it.each(['../escape', 'a/../../b', '/abs/path', 'a\\b', 'a/./b', '', 'a//b', 'C:/x'])(
    'rechaza la clave insegura %p',
    async (key) => {
      await expect(storage.put(key, Buffer.from('x'))).rejects.toBeInstanceOf(
        InvalidStorageKeyError,
      );
    },
  );

  it('falla al leer una clave inexistente', async () => {
    await expect(storage.createReadStream('missing/file')).rejects.toThrow();
  });

  it('delete no falla si la clave no existe', async () => {
    await expect(storage.delete('missing/file')).resolves.toBeUndefined();
  });
});
