import { Module } from '@nestjs/common';
import { APP_CONFIG } from '../../config/app-config.module';
import { type AppConfig } from '../../config/environment';
import { LocalDiskStorageProvider } from './local-disk-storage.provider';
import { STORAGE_PROVIDER, type StorageProvider } from './storage-provider';

@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig): StorageProvider => {
        switch (config.storage.driver) {
          case 'local':
            return new LocalDiskStorageProvider(config.storage.localPath);
        }
      },
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
