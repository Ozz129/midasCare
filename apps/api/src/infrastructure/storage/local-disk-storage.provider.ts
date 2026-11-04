import { createReadStream } from 'node:fs';
import { mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { type Readable } from 'node:stream';
import { type StorageProvider } from './storage-provider';

/** Claves válidas: segmentos alfanuméricos con `-` o `_`, separados por `/`. */
const KEY_PATTERN = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/;

export class InvalidStorageKeyError extends Error {
  constructor() {
    super('Clave de almacenamiento inválida');
    this.name = 'InvalidStorageKeyError';
  }
}

/**
 * Almacenamiento en disco local, fuera de cualquier directorio servido públicamente.
 * Adecuado para desarrollo y despliegues de un solo nodo.
 */
export class LocalDiskStorageProvider implements StorageProvider {
  readonly driver = 'local';
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = resolve(rootDir);
  }

  async put(key: string, content: Buffer): Promise<void> {
    const path = this.resolveKey(key);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    // flag "wx": falla si el archivo ya existe; nunca sobrescribe contenido.
    await writeFile(path, content, { flag: 'wx', mode: 0o600 });
  }

  async createReadStream(key: string): Promise<Readable> {
    const path = this.resolveKey(key);
    await stat(path);
    return createReadStream(path);
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolveKey(key), { force: true });
  }

  /** Resuelve la clave a una ruta absoluta garantizando que queda dentro de `rootDir`. */
  private resolveKey(key: string): string {
    if (!KEY_PATTERN.test(key)) {
      throw new InvalidStorageKeyError();
    }
    const path = resolve(this.rootDir, key);
    const relativePath = relative(this.rootDir, path);
    if (relativePath === '' || relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new InvalidStorageKeyError();
    }
    return path;
  }
}
