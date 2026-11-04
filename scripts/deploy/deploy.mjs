#!/usr/bin/env node
// Punto de entrada de despliegues de MIDAS CARE.
//
// Todavía NO existe un destino de despliegue (hosting, servidor o proveedor cloud).
// Este script valida los argumentos, informa del estado y termina con código 1
// SIN desplegar nada. Nunca debe informar un despliegue como exitoso si no ocurrió.
//
// Para configurar un destino real, ver infrastructure/deployment/README.md.

const TARGETS = new Set(['api', 'web', 'all']);
const ENVIRONMENTS = new Set(['staging', 'production']);

const [target, environment] = process.argv.slice(2);

if (!TARGETS.has(target) || !ENVIRONMENTS.has(environment)) {
  console.error('Uso: node scripts/deploy/deploy.mjs <api|web|all> <staging|production>');
  process.exit(2);
}

console.error(
  [
    '',
    `[deploy] Objetivo: ${target} | Entorno: ${environment}`,
    '[deploy] ESTADO: destino de despliegue NO configurado.',
    '[deploy] No se ha desplegado nada. No se ha contactado ningún servidor.',
    '[deploy] Consulta infrastructure/deployment/README.md para definir el destino.',
    '',
  ].join('\n'),
);

process.exit(1);
