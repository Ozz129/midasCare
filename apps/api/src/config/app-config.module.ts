import { type DynamicModule, Global, Module } from '@nestjs/common';
import { type AppConfig } from './environment';

/** Token de inyección de la configuración validada de la aplicación. */
export const APP_CONFIG = Symbol('APP_CONFIG');

@Global()
@Module({})
export class AppConfigModule {
  static forRoot(config: AppConfig): DynamicModule {
    return {
      module: AppConfigModule,
      providers: [{ provide: APP_CONFIG, useValue: Object.freeze(config) }],
      exports: [APP_CONFIG],
    };
  }
}
