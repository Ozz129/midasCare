import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_CONFIG } from '../../config/app-config.module';
import { type AppConfig } from '../../config/environment';
import { buildDataSourceOptions } from './data-source-options';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        ...buildDataSourceOptions(config),
        // En la app, las entidades se registran por módulo con TypeOrmModule.forFeature().
        // El glob de entidades queda solo para la CLI de migraciones (data-source.ts).
        entities: [],
        autoLoadEntities: true,
        retryAttempts: config.database.retryAttempts,
        retryDelay: 3000,
      }),
    }),
  ],
})
export class DatabaseModule {}
