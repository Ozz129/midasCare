# Despliegue

## Estado: SIN DESTINO CONFIGURADO

Todavía no se ha definido hosting, servidor ni proveedor cloud. Los comandos

```bash
pnpm deploy:api:staging
pnpm deploy:web:staging
pnpm deploy:staging
pnpm deploy:production
```

ejecutan `scripts/deploy/deploy.mjs`, que **solo** informa de que el destino no está
configurado y termina con código **1**. No despliega nada ni contacta ningún servidor.

## Artefactos que existen hoy

| App | Build            | Artefacto        | Ejecución                                         |
| --- | ---------------- | ---------------- | ------------------------------------------------- |
| API | `pnpm build:api` | `apps/api/dist/` | `node dist/main.js` (Node 24) + `pnpm db:migrate` |
| Web | `pnpm build:web` | `apps/web/dist/` | Archivos estáticos (cualquier servidor/CDN)       |

## Pasos para habilitar un destino

1. Elegir el proveedor y documentar la decisión en `docs/decisions/`.
2. Definir las variables de entorno de staging y production (ver `.env.example` de cada
   app) en el gestor de secretos del proveedor. **Nunca en Git.**
3. Implementar el despliegue real en `scripts/deploy/deploy.mjs`, o en un workflow de
   GitHub Actions con aprobación manual para production.
4. Incluir la ejecución de migraciones y una verificación de `GET /api/v1/health`
   **antes** de informar de que el despliegue ha terminado bien.
5. Solo entonces actualizar este documento.

## Requisitos de producción a tener en cuenta

- HTTPS obligatorio, `DATABASE_SSL=true` y Swagger desactivado (valor por defecto fuera
  de development).
- `STORAGE_LOCAL_PATH` en un volumen persistente, privado y con copia de seguridad (si se
  usan varias instancias, hará falta otro StorageProvider).
- Copias de seguridad de PostgreSQL y retención de `audit_logs` según la normativa
  sanitaria aplicable.
