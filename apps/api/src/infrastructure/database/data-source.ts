/**
 * DataSource utilizado exclusivamente por la CLI de TypeORM (migraciones).
 * Se ejecuta sobre el código compilado: `pnpm db:migrate` compila antes de migrar.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { loadAppConfig } from '../../config/environment';
import { loadEnvFile } from '../../config/load-env-file';
import { buildDataSourceOptions } from './data-source-options';

loadEnvFile();

export default new DataSource(buildDataSourceOptions(loadAppConfig(process.env)));
