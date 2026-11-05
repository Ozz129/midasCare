# Guía de scripts — MIDAS CARE

Referencia de todos los comandos del monorepo: qué hace cada uno, cuándo usarlo y qué
necesita para funcionar.

> **Usa siempre `pnpm`, no `npm`.** `pnpm dev` y `pnpm run dev` son equivalentes. Los
> scripts llaman internamente a `pnpm` y el proyecto depende de sus workspaces.

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Primera vez: puesta en marcha](#2-primera-vez-puesta-en-marcha)
3. [Uso diario](#3-uso-diario)
4. [Referencia de scripts de la raíz](#4-referencia-de-scripts-de-la-raíz)
5. [Base de datos y migraciones](#5-base-de-datos-y-migraciones)
6. [Calidad: lint, formato, tipos y pruebas](#6-calidad-lint-formato-tipos-y-pruebas)
7. [Compilación y ejecución en modo producción](#7-compilación-y-ejecución-en-modo-producción)
8. [Despliegues](#8-despliegues)
9. [Scripts por workspace](#9-scripts-por-workspace)
10. [Ejecutar un script en un solo workspace](#10-ejecutar-un-script-en-un-solo-workspace)
11. [Solución de problemas](#11-solución-de-problemas)

---

## 1. Requisitos

| Herramienta | Versión            | Comprobar          | Instalar                   |
| ----------- | ------------------ | ------------------ | -------------------------- |
| Node.js     | ≥ 24.11 (`.nvmrc`) | `node -v`          | <https://nodejs.org>       |
| pnpm        | 12                 | `pnpm -v`          | `npm i -g pnpm@12`         |
| PostgreSQL  | ≥ 13 (recom. 18)   | `pg_isready`       | Instalación local o Docker |
| Docker      | Opcional           | `docker --version` | Solo si usas `pnpm db:up`  |

---

## 2. Primera vez: puesta en marcha

Todos los comandos se ejecutan **desde la raíz del repositorio**.

### Opción rápida: script automático

```bash
bash scripts/setup.sh            # PostgreSQL instalado en tu equipo
bash scripts/setup.sh --docker   # PostgreSQL con Docker Compose
# o, equivalente:  pnpm setup:local
```

El script hace todo lo de esta sección:

1. Comprueba Node.js 24 y pnpm, e instala pnpm si falta.
2. Ejecuta `pnpm install`.
3. Crea los `.env` que falten y genera el secreto JWT y una contraseña aleatoria para la
   base de datos.
4. Crea el usuario `midas_care` y las bases `midas_care` y `midas_care_test`. Pide la
   contraseña de `postgres` sin mostrarla y no la guarda.
5. Aplica las migraciones en ambas bases.

Es **idempotente**: puedes ejecutarlo de nuevo en cualquier momento (por ejemplo, tras
bajar cambios con migraciones nuevas). Nunca borra bases de datos ni datos, y conserva el
`DATABASE_URL` y el secreto que ya tengas en `apps/api/.env`.

| Opción / variable | Efecto                                                          |
| ----------------- | --------------------------------------------------------------- |
| `--docker`        | Usa PostgreSQL con Docker Compose en lugar del instalado.       |
| `--skip-install`  | No ejecuta `pnpm install`.                                      |
| `--skip-db`       | Solo dependencias y `.env`, sin tocar la base de datos.         |
| `PGPASSWORD=...`  | Contraseña de `postgres`, sin preguntarla (útil en scripts/CI). |
| `PGSUPERUSER=...` | Superusuario distinto de `postgres`.                            |

> En Windows, ejecútalo desde **Git Bash**. `psql` debe estar en el PATH (viene con el
> instalador de PostgreSQL, en `C:\Program Files\PostgreSQL\<versión>\bin`).

### Opción manual

```bash
# 1. Instalar dependencias de todo el monorepo
pnpm install

# 2. Crear los archivos de entorno a partir de los ejemplos
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env      # opcional en desarrollo
```

### 2.1 Preparar PostgreSQL

**Opción A, PostgreSQL instalado en tu equipo.** En `psql` o pgAdmin, conectado como
`postgres`:

```sql
CREATE ROLE midas_care LOGIN PASSWORD 'elige-una-contraseña';
CREATE DATABASE midas_care OWNER midas_care;
```

**Opción B, Docker:**

```bash
cp .env.example .env     # credenciales solo para desarrollo local
pnpm db:up               # levanta postgres:18-alpine en 127.0.0.1:5432
```

### 2.2 Conectar la API a la base de datos

Edita `apps/api/.env` y ajusta la URL de conexión:

```env
DATABASE_URL=postgres://midas_care:elige-una-contraseña@localhost:5432/midas_care
```

### 2.3 Crear las tablas

```bash
pnpm db:migrate
```

### 2.4 Secreto de autenticación

`apps/api/.env` necesita `AUTH_ACCESS_TOKEN_SECRET`, de al menos 32 caracteres. Genera uno
y pégalo en el archivo:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### 2.5 Crear tu cuenta

Ejecuta `pnpm dev`, abre <http://localhost:5173/register> y completa el formulario. Al
crear la cuenta entras directamente al panel.

Alternativas sin interfaz (por ejemplo, para preparar usuarios de prueba):

- **Swagger:** abre <http://localhost:3000/api/docs>, ve a `POST /api/v1/auth/register`,
  pulsa "Try it out" y envía:

  ```json
  {
    "email": "tu.correo@consulta.com",
    "password": "una-contraseña-de-12-o-más",
    "givenName": "Nombre",
    "familyName": "Apellido",
    "workspaceName": "Consulta Nombre Apellido"
  }
  ```

- **PowerShell:**

  ```powershell
  Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/v1/auth/register `
    -ContentType 'application/json; charset=utf-8' `
    -Body ([System.Text.Encoding]::UTF8.GetBytes((@{
      email = 'tu.correo@consulta.com'; password = 'una-contraseña-de-12-o-más'
      givenName = 'Nombre'; familyName = 'Apellido'
    } | ConvertTo-Json)))
  ```

La contraseña debe tener entre 12 y 128 caracteres. El registro crea también tu espacio de
trabajo individual, con rol de propietario.

> Evita `curl` desde Git Bash si los nombres llevan tildes: puede enviar el texto en otra
> codificación y guardarlo con caracteres corruptos.

Listo. A partir de ahora inicia sesión en <http://localhost:5173/login>.

---

## 3. Uso diario

| Quiero...                             | Comando                                                   |
| ------------------------------------- | --------------------------------------------------------- |
| Trabajar en todo (API + web)          | `pnpm dev`                                                |
| Trabajar solo en el frontend (sin BD) | `pnpm dev:web`                                            |
| Trabajar solo en el backend           | `pnpm dev:api`                                            |
| Comprobar todo antes de subir cambios | `pnpm format && pnpm lint && pnpm typecheck && pnpm test` |
| Aplicar migraciones nuevas            | `pnpm db:migrate`                                         |

URLs en desarrollo:

| Servicio                       | URL                                   |
| ------------------------------ | ------------------------------------- |
| Web                            | <http://localhost:5173>               |
| API                            | <http://localhost:3000/api/v1/health> |
| Swagger                        | <http://localhost:3000/api/docs>      |
| Guía de componentes (solo dev) | <http://localhost:5173/design-system> |

Para detener los servidores, pulsa `Ctrl + C` en la terminal.

---

## 4. Referencia de scripts de la raíz

### Desarrollo

| Script         | Qué hace                                                                                                                  | Requiere                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `pnpm dev`     | Compila los paquetes compartidos y arranca **en paralelo** la API (:3000), la web (:5173) y los paquetes en modo _watch_. | PostgreSQL + `apps/api/.env` |
| `pnpm dev:api` | Compila los paquetes compartidos y arranca solo la API con recarga automática (`nest start --watch`).                     | PostgreSQL + `apps/api/.env` |
| `pnpm dev:web` | Compila los paquetes compartidos y arranca solo el frontend con Vite.                                                     | Nada                         |

> Si cambias un paquete compartido (`packages/*`) con `pnpm dev` en marcha, la web se
> recarga sola, pero la **API hay que reiniciarla**.

### Compilación y ejecución

| Script                | Qué hace                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `pnpm build`          | Compila todos los workspaces respetando el orden de dependencias.                                                     |
| `pnpm build:packages` | Compila solo los paquetes compartidos (`packages/*`).                                                                 |
| `pnpm build:api`      | Compila la API y los paquetes de los que depende. Salida: `apps/api/dist/`.                                           |
| `pnpm build:web`      | Compila la web (con comprobación de tipos) y sus dependencias. Salida: `apps/web/dist/`.                              |
| `pnpm start:api`      | Ejecuta la API **ya compilada** (`node dist/main.js`). Hay que ejecutar antes `pnpm build:api`.                       |
| `pnpm preview:web`    | Sirve el build de la web en <http://localhost:4173>. Hay que ejecutar antes `pnpm build:web`.                         |
| `pnpm clean`          | Borra `dist/`, `coverage/` y `*.tsbuildinfo` de apps y paquetes. No toca `node_modules`, `.env` ni el almacenamiento. |

### Calidad

| Script              | Qué hace                                                    |
| ------------------- | ----------------------------------------------------------- |
| `pnpm lint`         | Analiza todo el monorepo con ESLint.                        |
| `pnpm lint:fix`     | Igual, corrigiendo automáticamente lo que se pueda.         |
| `pnpm format`       | Formatea todo el código con Prettier.                       |
| `pnpm format:check` | Comprueba el formato sin modificar archivos (lo usa la CI). |
| `pnpm typecheck`    | Comprueba los tipos TypeScript de todos los workspaces.     |
| `pnpm test`         | Ejecuta las pruebas de todos los workspaces.                |

### Base de datos

| Script                            | Qué hace                                                            |
| --------------------------------- | ------------------------------------------------------------------- |
| `pnpm db:up`                      | Levanta PostgreSQL con Docker Compose (requiere `.env` en la raíz). |
| `pnpm db:down`                    | Detiene el contenedor. **Los datos se conservan** en el volumen.    |
| `pnpm db:migrate`                 | Compila la API y aplica las migraciones pendientes.                 |
| `pnpm db:revert`                  | Compila la API y revierte **solo la última** migración aplicada.    |
| `pnpm db:migration:create <ruta>` | Crea un archivo de migración vacío.                                 |

### Despliegue

| Script                    | Qué hace                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm deploy:api:staging` | **No despliega.** Informa de que el destino no está configurado y termina con error. |
| `pnpm deploy:web:staging` | Igual.                                                                               |
| `pnpm deploy:staging`     | Igual.                                                                               |
| `pnpm deploy:production`  | Igual.                                                                               |

Ver [sección 8](#8-despliegues).

---

## 5. Base de datos y migraciones

El esquema **nunca** cambia automáticamente (`synchronize: false`). Todo cambio pasa por
una migración versionada en `apps/api/src/infrastructure/database/migrations/`.

### Aplicar y revertir

```bash
pnpm db:migrate      # aplica las migraciones pendientes
pnpm db:revert       # deshace la última (repetir para deshacer más)
```

Ambos comandos leen la conexión de `apps/api/.env` (`DATABASE_URL`).

> ⚠️ `db:revert` puede **borrar tablas y datos**. No lo ejecutes contra una base con datos
> reales sin una copia de seguridad.

### Crear una migración a partir de cambios en las entidades (recomendado)

1. Modifica o crea entidades (`*.entity.ts`).
2. Asegúrate de que tu base local tiene aplicadas todas las migraciones (`pnpm db:migrate`).
3. Genera la migración comparando las entidades con la base:

   ```bash
   pnpm --filter @care/api run db:migration:generate src/infrastructure/database/migrations/NombreDelCambio
   ```

4. **Revisa el SQL generado** antes de aplicarlo.
5. Aplícala con `pnpm db:migrate`.

### Crear una migración vacía (SQL manual)

```bash
pnpm db:migration:create src/infrastructure/database/migrations/NombreDelCambio
```

> La ruta es relativa a `apps/api/`, porque el script se ejecuta dentro de ese workspace.

### Comprobar que las entidades y la base coinciden

```bash
pnpm build:api
pnpm --filter @care/api exec typeorm migration:generate -d dist/infrastructure/database/data-source.js --check src/infrastructure/database/migrations/Check
```

Debe responder `No changes in database schema were found`.

---

## 6. Calidad: lint, formato, tipos y pruebas

### Antes de subir cambios

```bash
pnpm format        # 1. formatea
pnpm lint          # 2. analiza
pnpm typecheck     # 3. tipos
pnpm test          # 4. pruebas
```

La CI (`.github/workflows/ci.yml`) ejecuta `format:check`, `lint`, `typecheck`, `build`,
las migraciones y `test` en cada push a `main` y en cada pull request.

### Pruebas

| Workspace            | Herramienta | Qué cubre                                                                                                          |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `@care/api`          | Jest        | Configuración de entorno, guard de tenants, almacenamiento local y pipeline HTTP (health, CORS, errores, Swagger). |
| `@care/web`          | Vitest      | Cliente HTTP, variables de entorno y validación del login.                                                         |
| `@care/shared-utils` | Vitest      | Utilidades compartidas.                                                                                            |

**Pruebas e2e con base de datos real.** La suite que arranca la API completa contra
PostgreSQL se **omite** salvo que definas `TEST_DATABASE_URL`, apuntando a una base con
las migraciones aplicadas:

```bash
# Bash / Git Bash
TEST_DATABASE_URL=postgres://midas_care:pass@localhost:5432/midas_care_test pnpm --filter @care/api test
```

```powershell
# PowerShell
$env:TEST_DATABASE_URL="postgres://midas_care:pass@localhost:5432/midas_care_test"; pnpm --filter @care/api test
```

> Usa una base **separada** para pruebas (por ejemplo `midas_care_test`), nunca la de
> desarrollo con datos que quieras conservar.

**Modo watch** (vuelve a ejecutar las pruebas al guardar):

```bash
pnpm --filter @care/api run test:watch
pnpm --filter @care/web exec vitest
```

---

## 7. Compilación y ejecución en modo producción

```bash
# API
pnpm build:api
pnpm db:migrate
pnpm start:api              # node apps/api/dist/main.js

# Web
pnpm build:web              # genera apps/web/dist/ (archivos estáticos)
pnpm preview:web            # sirve el build en http://localhost:4173
```

Diferencias respecto a desarrollo:

- Con `NODE_ENV=production`, **Swagger se desactiva** salvo que definas `SWAGGER_ENABLED=true`.
- En el build de la web, `VITE_API_URL` es **obligatoria** (en desarrollo tiene un valor
  por defecto).
- La guía de componentes (`/design-system`) **no se incluye** en el build de producción.

---

## 8. Despliegues

Todavía **no hay destino de despliegue configurado** (hosting, servidor o proveedor cloud).
Los comandos `deploy:*` ejecutan `scripts/deploy/deploy.mjs`, que:

- valida los argumentos;
- muestra `destino de despliegue NO configurado`;
- termina con **código de salida 1**, sin contactar ningún servidor.

Para habilitar un destino real, ver
[infrastructure/deployment/README.md](../infrastructure/deployment/README.md).

---

## 9. Scripts por workspace

Normalmente se usan a través de los scripts de la raíz. Aquí se listan como referencia.

### `@care/api` (`apps/api`)

| Script                  | Comando                                                                   |
| ----------------------- | ------------------------------------------------------------------------- |
| `build`                 | `nest build` → `dist/`                                                    |
| `dev`                   | `nest start --watch` (recarga automática)                                 |
| `start`                 | `node dist/main.js`                                                       |
| `typecheck`             | `tsc --noEmit` (incluye las pruebas)                                      |
| `test`                  | Jest (con `--experimental-vm-modules`, necesario porque NestJS 12 es ESM) |
| `test:watch`            | Jest en modo watch                                                        |
| `db:migrate`            | `typeorm migration:run` sobre `dist/`                                     |
| `db:revert`             | `typeorm migration:revert` sobre `dist/`                                  |
| `db:migration:create`   | `typeorm migration:create <ruta>`                                         |
| `db:migration:generate` | Compila y ejecuta `typeorm migration:generate <ruta>`                     |

### `@care/web` (`apps/web`)

| Script      | Comando                                 |
| ----------- | --------------------------------------- |
| `dev`       | `vite` (puerto 5173)                    |
| `build`     | `typecheck` + `vite build` → `dist/`    |
| `preview`   | `vite preview` (puerto 4173)            |
| `typecheck` | `tsc --noEmit` (app y `vite.config.ts`) |
| `test`      | `vitest run`                            |

### Paquetes compartidos (`packages/*`)

| Paquete               | `build` | `dev` (watch) | `typecheck` | `test` |
| --------------------- | :-----: | :-----------: | :---------: | :----: |
| `@care/shared-types`  |    ✔    |       ✔       |      ✔      |   —    |
| `@care/shared-utils`  |    ✔    |       ✔       |      ✔      |   ✔    |
| `@care/api-contracts` |    ✔    |       ✔       |      ✔      |   —    |
| `@care/config`        |    —    |       —       |      —      |   —    |

`@care/config` solo contiene configuración (presets de TypeScript y Prettier), así que no
tiene scripts.

---

## 10. Ejecutar un script en un solo workspace

```bash
pnpm --filter <paquete> run <script>
```

Ejemplos:

```bash
pnpm --filter @care/web test             # pruebas solo del frontend
pnpm --filter @care/api run test:watch   # pruebas de la API en modo watch
pnpm --filter @care/api... run build     # la API y todo lo que necesita (sufijo "...")
pnpm --filter "./packages/*" run build   # todos los paquetes compartidos
```

Para añadir una dependencia a un workspace concreto:

```bash
pnpm --filter @care/web add <paquete>
pnpm --filter @care/api add -D <paquete>
```

> pnpm 12 aplica una **política de edad mínima de publicación**: si una versión es muy
> reciente, la instalación falla. En ese caso, fija una versión anterior. Además, los
> scripts de instalación de dependencias deben aprobarse en `pnpm-workspace.yaml`
> (`allowBuilds`).

---

## 11. Solución de problemas

| Síntoma                                                                 | Causa probable y solución                                                                                 |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `pnpm: command not found` / no se reconoce                              | pnpm no está instalado o no está en el PATH: `npm i -g pnpm@12` y abre una terminal nueva.                |
| La API no arranca: `Configuración de entorno inválida`                  | Falta o es incorrecta alguna variable en `apps/api/.env`. El mensaje indica cuál.                         |
| La API no arranca: error de conexión / `password authentication failed` | PostgreSQL no está en marcha o `DATABASE_URL` tiene credenciales incorrectas.                             |
| `relation "users" does not exist`                                       | No se han aplicado las migraciones: `pnpm db:migrate`.                                                    |
| `relation "auth_sessions" does not exist` al iniciar sesión             | Falta la migración de sesiones: `pnpm db:migrate`.                                                        |
| `AUTH_ACCESS_TOKEN_SECRET: minLength` al arrancar                       | Falta el secreto o tiene menos de 32 caracteres: ver sección 2.4.                                         |
| El login dice "Correo o contraseña incorrectos."                        | Credenciales erróneas, o la cuenta aún no existe: créala (sección 2.5).                                   |
| "Demasiados intentos"                                                   | Límite de 10 intentos de login por minuto e IP. Espera un minuto.                                         |
| La sesión se pierde al recargar                                         | La API no está corriendo, o la web no está en un origen incluido en `CORS_ORIGINS`.                       |
| La web muestra "Sin conexión" en Estado del sistema                     | La API no está corriendo. Es normal con `pnpm dev:web`.                                                   |
| Error de CORS en el navegador                                           | Añade el origen de la web a `CORS_ORIGINS` en `apps/api/.env` y reinicia la API.                          |
| `Port 5173 is already in use` / `EADDRINUSE :3000`                      | Ya hay otra instancia en marcha. Ciérrala o libera el puerto.                                             |
| Tras cambiar `packages/*`, la API no ve los cambios                     | Reinicia `pnpm dev` o `pnpm dev:api`.                                                                     |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`                                | Has pedido una versión demasiado nueva: fija una versión anterior.                                        |
| `ERR_PNPM_IGNORED_BUILDS`                                               | Una dependencia quiere ejecutar scripts de instalación: decide en `allowBuilds` de `pnpm-workspace.yaml`. |
| `pnpm db:up` falla                                                      | Docker no está instalado o no existe el `.env` de la raíz (`cp .env.example .env`).                       |
