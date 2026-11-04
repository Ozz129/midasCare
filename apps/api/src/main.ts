import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, SWAGGER_PATH } from './app.setup';
import { EnvironmentValidationError, loadAppConfig } from './config/environment';
import { loadEnvFile } from './config/load-env-file';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  loadEnvFile();
  const config = loadAppConfig(process.env);

  const app = await NestFactory.create(AppModule.register(config), { bufferLogs: false });
  configureApp(app, config);

  await app.listen(config.port);

  logger.log(`MIDAS CARE API (${config.nodeEnv}) escuchando en el puerto ${config.port}`);
  if (config.swaggerEnabled) {
    logger.log(`Swagger disponible en ${config.publicUrl}/${SWAGGER_PATH}`);
  }
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  if (error instanceof EnvironmentValidationError) {
    logger.error(error.message);
  } else {
    logger.error(error instanceof Error ? (error.stack ?? error.message) : 'Error de arranque');
  }
  process.exit(1);
});
