# MIDAS CARE

Plataforma SaaS **multi-tenant** de historias clínicas electrónicas del ecosistema
**MIDAS TECH**. Está pensada para profesionales de salud independientes y para clínicas
con varios profesionales. El MVP empieza por **psicología**, pero la arquitectura no está
atada a ninguna especialidad.

> **Estado actual:** arquitectura base, módulos Core, autenticación real y frontend con el
> Design System. **Todavía no hay funcionalidades clínicas.**
> Ver [Estado del MVP](#estado-del-mvp).

## Stack

| Capa     | Tecnología                                                                  |
| -------- | --------------------------------------------------------------------------- |
| Backend  | Node.js 24 LTS, NestJS 12, TypeScript 6, TypeORM 1.x, PostgreSQL, Swagger   |
| Frontend | React 19, Vite 8, React Router 8, TanStack Query 5, Tailwind CSS 4          |
| Monorepo | pnpm 12 workspaces (un único `pnpm-lock.yaml`), configuración TS compartida |
| Calidad  | ESLint 10 (flat config), Prettier, TypeScript `strict`, Jest (API), Vitest  |

## Estructura

```text
apps/
  api/            @care/api        Backend NestJS (monolito modular, API REST /api/v1)
  web/            @care/web        Frontend React + Vite
  mobile/                          Reservado para futuras apps móviles (solo README)
packages/
  api-contracts/  @care/api-contracts  Contratos públicos de la API (sin entidades ORM)
  shared-types/   @care/shared-types   Tipos genéricos sin dependencias
  shared-utils/   @care/shared-utils   Utilidades puras
  config/         @care/config         Presets de TypeScript y Prettier
infrastructure/   docker/ (PostgreSQL local), database/, deployment/
scripts/          build/, deploy/, database/
docs/             architecture/, api/, decisions/
```

Detalle en [docs/architecture/monorepo.md](docs/architecture/monorepo.md).

## Requisitos previos

- **Node.js ≥ 24.11** (ver `.nvmrc`).
- **pnpm 12** (`corepack enable pnpm` o `npm i -g pnpm@12`).
- **PostgreSQL ≥ 13** (se recomienda 18). Puede ser Docker o una instalación local.

## Instalación

**Automática** (dependencias, `.env`, base de datos y migraciones, en un paso):

```bash
bash scripts/setup.sh            # PostgreSQL local  (o: pnpm setup:local)
bash scripts/setup.sh --docker   # PostgreSQL con Docker
```

El script es idempotente y no borra datos. Opciones en [docs/scripts.md](docs/scripts.md#2-primera-vez-puesta-en-marcha).

**Manual:**

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env     # opcional en desarrollo
```

> pnpm 12 aplica una política de edad mínima de publicación de paquetes y bloquea los
> scripts de instalación que no se han aprobado. Las decisiones tomadas están en
> `pnpm-workspace.yaml` (`allowBuilds`).

## PostgreSQL local

**Opción A: Docker Compose**

```bash
cp .env.example .env      # credenciales solo para desarrollo local
pnpm db:up                # postgres:18-alpine en 127.0.0.1:5432
pnpm db:down              # detiene el contenedor (los datos quedan en el volumen)
```

**Opción B: PostgreSQL instalado**

```sql
CREATE ROLE midas_care LOGIN PASSWORD 'cambia-esta-contraseña';
CREATE DATABASE midas_care OWNER midas_care;
```

Después ajusta `DATABASE_URL` en `apps/api/.env`.

**Migraciones**

```bash
pnpm db:migrate     # compila la API y aplica las migraciones pendientes
pnpm db:revert      # revierte SOLO la última migración aplicada
```

`synchronize` está desactivado: el esquema solo cambia mediante migraciones.

## Desarrollo

```bash
pnpm dev        # paquetes compartidos (watch) + API (:3000) + web (:5173)
pnpm dev:api    # solo backend
pnpm dev:web    # solo frontend
```

- API: <http://localhost:3000/api/v1/health>
- Swagger (solo en development): <http://localhost:3000/api/docs>
- Web: <http://localhost:5173>

La API **no arranca** si la configuración no es válida o si no puede conectarse a
PostgreSQL. Falla pronto y lo dice en un mensaje claro, sin mostrar valores secretos.

## Scripts de la raíz

| Script                                   | Descripción                                                         |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `pnpm dev` / `dev:api` / `dev:web`       | Desarrollo con recarga automática.                                  |
| `pnpm build` / `build:api` / `build:web` | Compilación en orden topológico (primero los paquetes que se usan). |
| `pnpm start:api`                         | Ejecuta la API compilada (`apps/api/dist`).                         |
| `pnpm preview:web`                       | Sirve el build web (:4173).                                         |
| `pnpm lint` / `lint:fix`                 | ESLint de todo el monorepo.                                         |
| `pnpm format` / `format:check`           | Prettier.                                                           |
| `pnpm typecheck`                         | Comprobación de tipos de todos los workspaces.                      |
| `pnpm test`                              | Pruebas de todos los workspaces.                                    |
| `pnpm db:up` / `db:down`                 | PostgreSQL local con Docker Compose.                                |
| `pnpm db:migrate` / `db:revert`          | Migraciones TypeORM.                                                |
| `pnpm db:migration:create <ruta>`        | Crea una migración vacía.                                           |
| `pnpm deploy:*`                          | **No despliegan nada todavía** (ver abajo).                         |
| `pnpm clean`                             | Borra `dist/`, `coverage/` y `*.tsbuildinfo`.                       |

### Despliegues

`pnpm deploy:api:staging`, `deploy:web:staging`, `deploy:staging` y `deploy:production`
avisan de que **el destino no está configurado** y terminan con código de salida 1 sin
contactar ningún servidor. Ver [infrastructure/deployment/README.md](infrastructure/deployment/README.md).

## Pruebas

```bash
pnpm test
```

- `shared-utils` y `web`: Vitest.
- `api`: Jest, con pruebas unitarias y e2e del pipeline HTTP. Estas usan el mismo
  `configureApp()` que `main.ts` con una base de datos simulada.
- **e2e con PostgreSQL** (arranque completo de `AppModule`): solo se ejecuta si existe
  `TEST_DATABASE_URL`, apuntando a una base con las migraciones aplicadas. Si no, se omite.

```bash
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/midas_care_test pnpm --filter @care/api test
```

## Variables de entorno

| Archivo                 | Uso                                                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env.example`          | Credenciales de PostgreSQL para Docker Compose.                                                                                              |
| `apps/api/.env.example` | `NODE_ENV`, `API_PORT`, `API_PUBLIC_URL`, `CORS_ORIGINS`, `DATABASE_*`, `SWAGGER_ENABLED`, `STORAGE_*` y variables futuras de autenticación. |
| `apps/web/.env.example` | `VITE_API_URL`, `VITE_APP_ENV`. **Todo `VITE_*` es público.**                                                                                |

Entornos admitidos: `development`, `staging`, `production` (además de `test` para las
pruebas). Los archivos `.env` reales están en `.gitignore`.

## Estado del MVP

**Implementado**

- Monorepo pnpm con paquetes compartidos y scripts centralizados.
- API NestJS: configuración validada, TypeORM/PostgreSQL con migraciones, prefijo `/api/v1`,
  `GET /api/v1/health`, Swagger, helmet, CORS explícito, `ValidationPipe` global y un
  filtro de errores que no expone detalles internos.
- Core: entidades y servicios internos de `users`, `tenants`, `memberships`,
  `professionals`, `files` (almacenamiento local privado) y `audit`. Incluye un guard de
  acceso por tenant que deniega por defecto (fail-closed).
- **Autenticación real:**
  - registro, login, refresh rotatorio en cookie `httpOnly`, logout y `GET /auth/me`;
  - `GET /tenants` para los espacios de trabajo del usuario;
  - límite de intentos y auditoría de los accesos.
- Migraciones: esquema Core y `auth_sessions`.
- **Web:**
  - Design System Clinical Calm + MIDAS Gold;
  - login y registro conectados a la API;
  - sesión en memoria con restauración automática al recargar;
  - área protegida (panel y configuración) y cierre de sesión.

**No implementado (a propósito)**

- Acceso con Google / Microsoft: los botones son marcadores visibles y deshabilitados.
- Recuperación de contraseña y verificación de correo.
- Todo lo clínico: pacientes, historias clínicas, consultas, formularios, firmas, etc.
- Aplicaciones móviles, infraestructura cloud y despliegues.

## Documentación

- [Guía de scripts](docs/scripts.md): todos los comandos, puesta en marcha y solución de problemas
- [Visión general](docs/architecture/overview.md)
- [Backend](docs/architecture/backend.md)
- [Frontend](docs/architecture/frontend.md)
- [Monorepo](docs/architecture/monorepo.md)
- [API](docs/api/README.md)
- [Decisiones de arquitectura](docs/decisions/README.md)
