import { type DynamicModule, Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module';
import { type AppConfig } from './config/environment';
import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './infrastructure/database/database.module';

/**
 * Módulo raíz del monolito modular.
 * - core/: módulos transversales (auth, users, tenants, ...).
 * - modules/: módulos de negocio/clínicos (todavía ninguno, ver modules/README.md).
 */
@Module({})
export class AppModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [AppConfigModule.forRoot(config), DatabaseModule, CoreModule, HealthModule],
    };
  }
}
