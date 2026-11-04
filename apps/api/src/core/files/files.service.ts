import { createHash, randomUUID } from 'node:crypto';
import { type Readable } from 'node:stream';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '../../infrastructure/storage/storage-provider';
import { type StoredFile } from './entities/stored-file.entity';
import { FilesRepository } from './files.repository';

export interface StoreFileInput {
  /** Tenant obtenido del contexto validado (TenantAccessGuard), nunca del cliente directamente. */
  tenantId: string;
  uploadedByUserId: string | null;
  originalName: string;
  mimeType: string;
  content: Buffer;
}

/**
 * Gestión de archivos privados por tenant.
 * No expone endpoints públicos: los módulos de negocio deciden quién puede
 * subir o descargar y delegan aquí con un tenant ya verificado.
 */
@Injectable()
export class FilesService {
  constructor(
    private readonly filesRepository: FilesRepository,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async store(input: StoreFileInput): Promise<StoredFile> {
    const id = randomUUID();
    const storageKey = `tenants/${input.tenantId}/${id}`;

    await this.storage.put(storageKey, input.content);

    try {
      return await this.filesRepository.save(
        this.filesRepository.create({
          id,
          tenantId: input.tenantId,
          storageDriver: this.storage.driver,
          storageKey,
          originalName: input.originalName,
          mimeType: input.mimeType,
          sizeBytes: String(input.content.byteLength),
          checksumSha256: createHash('sha256').update(input.content).digest('hex'),
          uploadedByUserId: input.uploadedByUserId,
        }),
      );
    } catch (error) {
      // Evita contenido huérfano si fallan los metadatos.
      await this.storage.delete(storageKey);
      throw error;
    }
  }

  async open(tenantId: string, fileId: string): Promise<{ file: StoredFile; stream: Readable }> {
    const file = await this.filesRepository.findInTenant(tenantId, fileId);
    if (!file) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return { file, stream: await this.storage.createReadStream(file.storageKey) };
  }
}
