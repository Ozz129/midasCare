import { join } from 'node:path';
import { type DataSourceOptions } from 'typeorm';
import { type AppConfig } from '../../config/environment';
import { SnakeNamingStrategy } from './snake-naming.strategy';

/**
 * Opciones de TypeORM compartidas por la aplicación NestJS y por la CLI de migraciones.
 * `synchronize` está desactivado siempre: el esquema solo cambia mediante migraciones.
 */
export function buildDataSourceOptions(config: AppConfig): DataSourceOptions {
  return {
    type: 'postgres',
    url: config.database.url,
    ssl: config.database.ssl ? { rejectUnauthorized: true } : false,
    logging: config.database.logging ? ['query', 'error', 'schema', 'migration'] : ['error'],
    namingStrategy: new SnakeNamingStrategy(),
    // gen_random_uuid() es nativo en PostgreSQL >= 13 (no requiere extensiones).
    uuidExtension: 'pgcrypto',
    // No crear extensiones automáticamente: el esquema solo cambia con migraciones.
    installExtensions: false,
    synchronize: false,
    migrationsRun: false,
    migrationsTableName: 'schema_migrations',
    // Se cargan los archivos compilados (dist/). Las entidades viven junto a su módulo.
    entities: [join(__dirname, '..', '..', '**', '*.entity.js')],
    migrations: [join(__dirname, 'migrations', '*.js')],
    applicationName: 'midas-care-api',
  };
}
