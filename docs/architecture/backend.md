# Backend (`apps/api`)

## Organización

```text
src/
├── main.ts               Arranque: carga .env, valida la config y levanta Nest
├── app.module.ts         AppModule.register(config)
├── app.setup.ts          configureApp(): prefijo, helmet, CORS, pipes, filtros, Swagger
├── config/               Validación de entorno (class-validator) → AppConfig tipada
├── common/               Piezas HTTP genéricas: decorators, filters, pipes, guards, interceptors, types
├── core/                 Módulos transversales (ver abajo)
├── modules/              Módulos clínicos (futuros). Ver modules/README.md
├── health/               GET /api/v1/health
└── infrastructure/
    ├── database/         TypeORM: opciones, DataSource de la CLI, naming strategy, entidades base, migraciones
    ├── storage/          StorageProvider + LocalDiskStorageProvider
    └── security/         helmet + CORS explícito
```

### Patrón interno de cada módulo

```text
example/
├── example.module.ts
├── example.controller.ts   transporte HTTP (solo cuando hay endpoints reales)
├── example.service.ts      casos de uso
├── example.repository.ts   acceso a persistencia (envuelve Repository<T> de TypeORM)
├── dto/                    validación y contratos de entrada/salida
├── entities/               modelo TypeORM
└── policies/               autorización específica
```

Solo se crean los archivos que hacen falta. No hay CQRS ni DDD completo.

## Módulos Core

| Módulo                | Contenido actual                                                                                        | Endpoints                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `AuthModule`          | Registro, login, sesiones rotatorias, `JwtAuthGuard` ([README](../../apps/api/src/core/auth/README.md)) | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` |
| `UsersModule`         | `User`, repositorio, `UsersService` (perfil público sin hash)                                           | Previstos (`/users/me`)                                                      |
| `TenantsModule`       | `Tenant` (INDIVIDUAL/ORGANIZATION), servicio                                                            | `GET /tenants` (previstos: `/tenants/:id`)                                   |
| `MembershipsModule`   | `Membership` (rol, estado), `findActiveMembership`                                                      | —                                                                            |
| `AccessControlModule` | `TenantAccessGuard`, `@RequireRoles()`, `@CurrentTenant()`                                              | —                                                                            |
| `ProfessionalsModule` | `ProfessionalProfile`, servicio                                                                         | —                                                                            |
| `FilesModule`         | `StoredFile` (metadatos), `FilesService.store/open` por tenant                                          | — (sin acceso público a archivos)                                            |
| `AuditModule`         | `AuditLog` (solo inserción), `AuditService.record()`                                                    | — (sin CRUD público)                                                         |

Los módulos de negocio importan directamente los módulos Core que necesiten.
`CoreModule` solo los agrupa para registrarlos en `AppModule`.

## Configuración

`loadAppConfig(process.env)` valida todas las variables al arrancar y devuelve una
`AppConfig` inmutable, que se inyecta con el token `APP_CONFIG`. Si algo no es válido la
API no arranca, y el mensaje nombra la variable pero **nunca muestra su valor**.

No se usa `@nestjs/config`. El archivo `.env` se carga con `process.loadEnvFile()`
(nativo de Node), así se evita una dependencia extra.

## Base de datos

- PostgreSQL ≥ 13. Los UUID se generan con `gen_random_uuid()` (nativo, sin extensiones).
- `synchronize: false` siempre. El esquema cambia solo con migraciones
  (`src/infrastructure/database/migrations`). La tabla de control es `schema_migrations`.
- `SnakeNamingStrategy` propia: tablas y columnas en `snake_case` y restricciones con
  nombres deterministas (`pk_`, `uq_`, `fk_`, `ix_`).
- Fechas en `TIMESTAMPTZ`.
- En la aplicación, las entidades se registran con `TypeOrmModule.forFeature()`
  (`autoLoadEntities`). La CLI de migraciones carga `dist/**/*.entity.js`.

### Esquema actual

- `InitialCoreSchema`: `users`, `tenants`, `memberships`, `professional_profiles`,
  `stored_files`, `audit_logs`.
- `AuthSessions`: `auth_sessions`. Guarda el SHA-256 del refresh token vigente; si se
  elimina el usuario, sus sesiones se borran en cascada.

`audit_logs` no tiene claves foráneas a propósito, para que la trazabilidad sobreviva a
cambios en las entidades referenciadas.

### Flujo de migraciones

```bash
# 1. Modificar/crear entidades
# 2. Generar la migración comparando con una BD con el esquema actual
pnpm --filter @care/api run db:migration:generate src/infrastructure/database/migrations/NombreCambio
# 3. Revisar el SQL generado; 4. Aplicar
pnpm db:migrate
```

No ejecutes `db:revert` en entornos con datos reales sin una copia de seguridad.

## Seguridad

- `helmet` (cabeceras de seguridad) y CORS restringido a `CORS_ORIGINS`. El comodín `*`
  está prohibido.
- `ValidationPipe` global con `whitelist` + `forbidNonWhitelisted`: no se puede asignar en
  bloque `tenantId`, `role`, etc.
- `AllExceptionsFilter`: todos los errores siguen el formato `ApiErrorResponse`. Los 5xx
  devuelven un mensaje genérico, y el detalle solo va al log del servidor (sin cuerpo,
  cabeceras ni query string). El 404 por defecto no repite la URL.
- **Autenticación:**
  - `JwtAuthGuard` valida el access token (HS256, emisor y audiencia) y es el único
    punto que asigna `request.user`;
  - sin token válido, `@CurrentUser()` y `TenantAccessGuard` responden 401;
  - contraseñas con scrypt, refresh token rotatorio en cookie `httpOnly` + `SameSite=Strict`;
  - límite de intentos en login y registro, y auditoría de accesos.
  - Ver [AuthModule](../../apps/api/src/core/auth/README.md).
- Archivos: las claves son opacas y las genera el backend; están protegidas contra path
  traversal, no se sobrescriben y no hay ruta pública. El acceso siempre filtra por tenant.
- Sin usuarios hardcodeados ni bypass para pruebas.

## Nota técnica: NestJS 12 es ESM

Los paquetes de NestJS 12 se publican solo como ESM. La API se compila a **CommonJS**
(más estable con decoradores y TypeORM) y Node 24 los carga gracias a `require(esm)`.
Jest necesita `--experimental-vm-modules` para hacer lo mismo, y por eso el script `test`
de la API invoca Node con ese flag.

## Pruebas

| Archivo                                          | Qué valida                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `config/environment.spec.ts`                     | Validación de entorno y que no se filtren secretos                  |
| `access-control/.../tenant-access.guard.spec.ts` | 401/400/403 y contexto de tenant validado                           |
| `storage/local-disk-storage.provider.spec.ts`    | Lectura/escritura, no sobrescritura, claves inseguras               |
| `test/http.e2e-spec.ts`                          | Health, helmet, CORS, formato de error, rutas inexistentes, Swagger |
| `test/app.e2e-spec.ts`                           | Arranque real con PostgreSQL (requiere `TEST_DATABASE_URL`)         |
