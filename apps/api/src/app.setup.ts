import { API_PREFIX } from '@care/api-contracts';
import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { createValidationPipe } from './common/pipes/create-validation-pipe';
import { type AppConfig } from './config/environment';
import { applyHttpSecurity } from './infrastructure/security/http-security';

export const SWAGGER_PATH = 'api/docs';

/**
 * Configuración HTTP común de la aplicación. Se usa en main.ts y en las pruebas
 * e2e para que ambas ejerciten exactamente el mismo pipeline.
 */
export function configureApp(app: INestApplication, config: AppConfig): void {
  app.setGlobalPrefix(API_PREFIX);
  applyHttpSecurity(app, config);
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (config.swaggerEnabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('MIDAS CARE API')
        .setDescription('API REST de MIDAS CARE. Solo se documentan los endpoints implementados.')
        .setVersion('v1')
        .addServer(config.publicUrl)
        .addBearerAuth()
        .addCookieAuth('mc_refresh')
        .build(),
    );
    SwaggerModule.setup(SWAGGER_PATH, app, document);
  }
}
