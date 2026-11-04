import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { StoredFile } from './entities/stored-file.entity';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';

/** Almacenamiento privado, metadatos y control de acceso a archivos por tenant. */
@Module({
  imports: [TypeOrmModule.forFeature([StoredFile]), StorageModule],
  providers: [FilesRepository, FilesService],
  exports: [FilesService],
})
export class FilesModule {}
