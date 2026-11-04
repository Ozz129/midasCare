import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Carga `apps/api/.env` (si existe) usando el soporte nativo de Node.
 * Las variables ya definidas en el entorno del proceso tienen prioridad.
 */
export function loadEnvFile(path = resolve(process.cwd(), '.env')): void {
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}
