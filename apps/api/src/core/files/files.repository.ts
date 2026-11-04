import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoredFile } from './entities/stored-file.entity';

@Injectable()
export class FilesRepository {
  constructor(@InjectRepository(StoredFile) private readonly repository: Repository<StoredFile>) {}

  /** Siempre filtra por tenant: un archivo de otro tenant se comporta como inexistente. */
  findInTenant(tenantId: string, fileId: string): Promise<StoredFile | null> {
    return this.repository.findOneBy({ id: fileId, tenantId });
  }

  save(file: StoredFile): Promise<StoredFile> {
    return this.repository.save(file);
  }

  create(data: Partial<StoredFile>): StoredFile {
    return this.repository.create(data);
  }
}
