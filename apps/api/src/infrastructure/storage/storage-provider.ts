import { type Readable } from 'node:stream';

/** Token de inyección del proveedor de almacenamiento activo. */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

/**
 * Abstracción de almacenamiento PRIVADO de archivos.
 * Las claves son opacas y generadas por el backend; nunca derivan de nombres
 * proporcionados por el usuario. No existe acceso público directo: todo acceso
 * pasa por FilesService, que verifica el tenant.
 */
export interface StorageProvider {
  /** Identificador del driver (se persiste en los metadatos del archivo). */
  readonly driver: string;
  /** Guarda el contenido. Falla si la clave ya existe (no sobrescribe). */
  put(key: string, content: Buffer): Promise<void>;
  /** Abre un flujo de lectura. Falla si la clave no existe. */
  createReadStream(key: string): Promise<Readable>;
  /** Elimina el contenido. No falla si la clave no existe. */
  delete(key: string): Promise<void>;
}
