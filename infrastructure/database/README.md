# Base de datos

- Motor: **PostgreSQL ≥ 13** (se recomienda 18; Docker Compose usa `postgres:18-alpine`).
- Una base **compartida** para todos los tenants. El aislamiento se consigue con `tenant_id`.
- Las migraciones están en `apps/api/src/infrastructure/database/migrations/` (TypeORM).
  La tabla de control es `schema_migrations`.
- Convenciones: `snake_case`, PK `uuid` con `gen_random_uuid()`, fechas `TIMESTAMPTZ` y
  restricciones con nombre (`pk_`, `uq_`, `fk_`, `ix_`).

Ver [docs/architecture/backend.md](../../docs/architecture/backend.md#base-de-datos).

## Pendiente de definir

- Usuario de aplicación con privilegios mínimos (sin DDL) separado del usuario de migraciones.
- Row Level Security de PostgreSQL como segunda barrera multi-tenant (a evaluar).
- Política de copias de seguridad y retención.
