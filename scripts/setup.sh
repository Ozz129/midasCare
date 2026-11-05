#!/usr/bin/env bash
# =============================================================================
# MIDAS CARE — Puesta en marcha del entorno local
# -----------------------------------------------------------------------------
# 1. Comprueba Node.js (>= 24) y pnpm.
# 2. Instala las dependencias del monorepo (pnpm install).
# 3. Crea los archivos .env que falten (sin sobrescribir los existentes) y
#    genera el secreto JWT si está vacío.
# 4. Prepara PostgreSQL: usuario de la app + base de desarrollo + base de pruebas.
#    - Modo "local" (por defecto): PostgreSQL instalado en tu equipo (usa psql).
#    - Modo "docker": PostgreSQL con Docker Compose (pnpm db:up).
# 5. Aplica las migraciones (pnpm db:migrate).
#
# Es IDEMPOTENTE: puedes ejecutarlo varias veces. Nunca borra bases de datos ni
# datos. La contraseña del superusuario de PostgreSQL se pide sin mostrarla y
# no se guarda en ningún archivo.
#
# Uso:
#   bash scripts/setup.sh                 # todo, PostgreSQL local
#   bash scripts/setup.sh --docker        # todo, PostgreSQL con Docker
#   bash scripts/setup.sh --skip-install  # sin pnpm install
#   bash scripts/setup.sh --skip-db       # solo dependencias y .env
#   bash scripts/setup.sh --help
#
# Variables opcionales (modo local):
#   PGSUPERUSER  (por defecto: postgres)   PGHOST (localhost)   PGPORT (5432)
#   PGPASSWORD   contraseña del superusuario (si no, se pide de forma interactiva)
# =============================================================================
set -euo pipefail

# --- Utilidades de salida ----------------------------------------------------
if [ -t 1 ]; then
  BOLD=$'\033[1m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; BLUE=$'\033[34m'; RESET=$'\033[0m'
else
  BOLD=''; GREEN=''; YELLOW=''; RED=''; BLUE=''; RESET=''
fi
step() { printf '\n%s==> %s%s\n' "$BLUE$BOLD" "$1" "$RESET"; }
ok()   { printf '%s  ✔ %s%s\n' "$GREEN" "$1" "$RESET"; }
warn() { printf '%s  ! %s%s\n' "$YELLOW" "$1" "$RESET"; }
fail() { printf '%s  ✘ %s%s\n' "$RED" "$1" "$RESET" >&2; exit 1; }

# --- Argumentos ----------------------------------------------------------------
MODE="local"
SKIP_INSTALL=false
SKIP_DB=false
for arg in "$@"; do
  case "$arg" in
    --docker) MODE="docker" ;;
    --local) MODE="local" ;;
    --skip-install) SKIP_INSTALL=true ;;
    --skip-db) SKIP_DB=true ;;
    -h|--help)
      sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) fail "Opción desconocida: $arg (usa --help)" ;;
  esac
done

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# MIDAS_API_ENV permite usar otro archivo (p. ej. para pruebas del propio script).
API_ENV="${MIDAS_API_ENV:-apps/api/.env}"
WEB_ENV="apps/web/.env"
ROOT_ENV=".env"

printf '%sMIDAS CARE · configuración del entorno local%s\n' "$BOLD" "$RESET"
printf 'Directorio: %s · Modo de base de datos: %s\n' "$ROOT" "$MODE"

# --- 1. Requisitos -------------------------------------------------------------
step "Comprobando requisitos"

command -v node >/dev/null 2>&1 || fail "Node.js no está instalado. Instala Node.js 24 LTS: https://nodejs.org"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 24 ] || fail "Se requiere Node.js >= 24 (tienes $(node -v))."
ok "Node.js $(node -v)"

if ! command -v pnpm >/dev/null 2>&1; then
  warn "pnpm no está instalado. Intentando instalarlo…"
  if corepack enable pnpm >/dev/null 2>&1 && command -v pnpm >/dev/null 2>&1; then
    ok "pnpm activado con corepack"
  else
    npm install -g pnpm@12 >/dev/null 2>&1 || fail "No se pudo instalar pnpm. Ejecuta: npm install -g pnpm@12"
    hash -r
    command -v pnpm >/dev/null 2>&1 || fail "pnpm instalado pero no está en el PATH. Abre una terminal nueva y repite."
    ok "pnpm instalado con npm"
  fi
fi
ok "pnpm $(pnpm -v)"

# --- 2. Dependencias -------------------------------------------------------------
if [ "$SKIP_INSTALL" = true ]; then
  step "Dependencias (omitido: --skip-install)"
else
  step "Instalando dependencias (pnpm install)"
  pnpm install
  ok "Dependencias instaladas"
fi

# --- 3. Archivos de entorno ---------------------------------------------------------
step "Archivos de entorno"

copy_if_missing() {
  local example="$1" target="$2"
  if [ -f "$target" ]; then
    ok "$target ya existe (se conserva)"
  else
    cp "$example" "$target"
    ok "$target creado desde $example"
  fi
}
copy_if_missing "apps/api/.env.example" "$API_ENV"
copy_if_missing "apps/web/.env.example" "$WEB_ENV"
[ "$MODE" = "docker" ] && copy_if_missing ".env.example" "$ROOT_ENV"

# Lee el valor de una variable de un archivo .env (sin ejecutarlo).
env_get() {
  node -e '
    const fs = require("fs");
    const [file, key] = process.argv.slice(1);
    const line = fs.readFileSync(file, "utf8").split(/\r?\n/).find((l) => l.startsWith(key + "="));
    process.stdout.write(line ? line.slice(key.length + 1).trim() : "");
  ' "$1" "$2"
}

# Escribe o reemplaza una variable en un archivo .env (sin tocar el resto).
env_set() {
  node -e '
    const fs = require("fs");
    const [file, key, value] = process.argv.slice(1);
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    const index = lines.findIndex((l) => l.startsWith(key + "="));
    if (index >= 0) lines[index] = key + "=" + value;
    else lines.splice(lines.length - (lines.at(-1) === "" ? 1 : 0), 0, key + "=" + value);
    fs.writeFileSync(file, lines.join("\n"));
  ' "$1" "$2" "$3"
}

random_secret() { node -e "process.stdout.write(require('crypto').randomBytes(${1:-48}).toString('base64url'))"; }

if [ -z "$(env_get "$API_ENV" AUTH_ACCESS_TOKEN_SECRET)" ]; then
  env_set "$API_ENV" AUTH_ACCESS_TOKEN_SECRET "$(random_secret 48)"
  ok "Secreto JWT generado en $API_ENV"
else
  ok "Secreto JWT ya configurado (se conserva)"
fi

if [ "$SKIP_DB" = true ]; then
  step "Base de datos (omitido: --skip-db)"
  printf '\n%sListo.%s Configura DATABASE_URL en %s y ejecuta: pnpm db:migrate\n' "$GREEN$BOLD" "$RESET" "$API_ENV"
  exit 0
fi

# --- 4. Base de datos ---------------------------------------------------------------
step "Preparando PostgreSQL (modo $MODE)"

# Descompone DATABASE_URL en partes (maneja contraseñas codificadas en la URL).
parse_url() {
  node -e '
    const u = new URL(process.argv[1]);
    const out = [decodeURIComponent(u.username), decodeURIComponent(u.password),
      u.hostname || "localhost", u.port || "5432", u.pathname.replace(/^\//, "")];
    process.stdout.write(out.join("\n"));
  ' "$1"
}

build_url() {
  node -e '
    const [user, pass, host, port, db] = process.argv.slice(1);
    process.stdout.write(`postgres://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`);
  ' "$@"
}

valid_identifier() { [[ "$1" =~ ^[a-z_][a-z0-9_]{0,62}$ ]]; }

if [ "$MODE" = "docker" ]; then
  command -v docker >/dev/null 2>&1 || fail "Docker no está instalado. Instálalo o usa el modo local (sin --docker)."
  docker info >/dev/null 2>&1 || fail "Docker no está en ejecución. Inicia Docker Desktop y repite."

  APP_USER="$(env_get "$ROOT_ENV" POSTGRES_USER)"
  APP_PASS="$(env_get "$ROOT_ENV" POSTGRES_PASSWORD)"
  APP_DB="$(env_get "$ROOT_ENV" POSTGRES_DB)"
  DB_PORT="$(env_get "$ROOT_ENV" POSTGRES_PORT)"; DB_PORT="${DB_PORT:-5432}"
  DB_HOST="localhost"
  valid_identifier "$APP_USER" && valid_identifier "$APP_DB" || fail "POSTGRES_USER/POSTGRES_DB en .env deben ser identificadores simples (a-z, 0-9, _)."

  pnpm db:up
  printf '  Esperando a que PostgreSQL acepte conexiones'
  for _ in $(seq 1 60); do
    if docker compose -f infrastructure/docker/docker-compose.yml --env-file "$ROOT_ENV" \
      exec -T postgres pg_isready -U "$APP_USER" -d "$APP_DB" >/dev/null 2>&1; then
      break
    fi
    printf '.'; sleep 1
  done
  printf '\n'
  ok "PostgreSQL (Docker) listo en $DB_HOST:$DB_PORT"

  # Base de pruebas (la imagen solo crea POSTGRES_DB).
  TEST_DB="${APP_DB}_test"
  EXISTS="$(docker compose -f infrastructure/docker/docker-compose.yml --env-file "$ROOT_ENV" \
    exec -T postgres psql -U "$APP_USER" -d "$APP_DB" -tAc "SELECT 1 FROM pg_database WHERE datname = '$TEST_DB'")"
  if [ "$EXISTS" = "1" ]; then
    ok "Base de pruebas $TEST_DB ya existe"
  else
    docker compose -f infrastructure/docker/docker-compose.yml --env-file "$ROOT_ENV" \
      exec -T postgres psql -U "$APP_USER" -d "$APP_DB" -c "CREATE DATABASE \"$TEST_DB\" OWNER \"$APP_USER\"" >/dev/null
    ok "Base de pruebas $TEST_DB creada"
  fi

  env_set "$API_ENV" DATABASE_URL "$(build_url "$APP_USER" "$APP_PASS" "$DB_HOST" "$DB_PORT" "$APP_DB")"
  ok "DATABASE_URL actualizado en $API_ENV"
else
  command -v psql >/dev/null 2>&1 || fail "No se encontró psql. Instala PostgreSQL (>= 13) y añade su carpeta bin al PATH, o usa --docker."

  # Credenciales de la aplicación: se toman de DATABASE_URL si ya está configurado.
  CURRENT_URL="$(env_get "$API_ENV" DATABASE_URL)"
  [ -n "$CURRENT_URL" ] || CURRENT_URL="postgres://midas_care:midas_care_dev_password@localhost:5432/midas_care"
  { read -r APP_USER; read -r APP_PASS; read -r DB_HOST; read -r DB_PORT; read -r APP_DB; } < <(parse_url "$CURRENT_URL"; echo)

  valid_identifier "$APP_USER" || fail "El usuario de DATABASE_URL ('$APP_USER') debe ser un identificador simple (a-z, 0-9, _)."
  valid_identifier "$APP_DB" || fail "La base de DATABASE_URL ('$APP_DB') debe ser un identificador simple (a-z, 0-9, _)."
  TEST_DB="${APP_DB}_test"

  # La contraseña de ejemplo del .env.example nunca se usa: se genera una aleatoria.
  if [ -z "$APP_PASS" ] || [ "$APP_PASS" = "midas_care_dev_password" ]; then
    APP_PASS="$(random_secret 24)"
    env_set "$API_ENV" DATABASE_URL "$(build_url "$APP_USER" "$APP_PASS" "$DB_HOST" "$DB_PORT" "$APP_DB")"
    ok "Contraseña aleatoria generada para '$APP_USER' (guardada en $API_ENV)"
  fi

  export PGHOST="${PGHOST:-$DB_HOST}" PGPORT="${PGPORT:-$DB_PORT}"
  SUPERUSER="${PGSUPERUSER:-postgres}"

  pg_isready -h "$PGHOST" -p "$PGPORT" >/dev/null 2>&1 \
    || fail "PostgreSQL no responde en $PGHOST:$PGPORT. Inicia el servicio y repite."
  ok "PostgreSQL responde en $PGHOST:$PGPORT"

  # ¿Ya funciona la conexión con las credenciales de la app? Entonces no hace falta el superusuario.
  if PGPASSWORD="$APP_PASS" psql -U "$APP_USER" -d "$APP_DB" -w -tAc "SELECT 1" >/dev/null 2>&1 \
    && PGPASSWORD="$APP_PASS" psql -U "$APP_USER" -d "$TEST_DB" -w -tAc "SELECT 1" >/dev/null 2>&1; then
    ok "El usuario '$APP_USER' y las bases '$APP_DB' y '$TEST_DB' ya existen y son accesibles"
  else
    if [ -z "${PGPASSWORD:-}" ]; then
      [ -t 0 ] || fail "Se necesita la contraseña de '$SUPERUSER'. Sin terminal interactiva, defínela así: PGPASSWORD=... bash scripts/setup.sh"
      printf '  Contraseña del superusuario "%s" de PostgreSQL (no se muestra ni se guarda): ' "$SUPERUSER"
      read -r -s SUPERPASS || fail "No se pudo leer la contraseña."
      printf '\n'
    else
      SUPERPASS="$PGPASSWORD"
    fi

    as_super() { PGPASSWORD="$SUPERPASS" psql -U "$SUPERUSER" -d postgres -w -v ON_ERROR_STOP=1 "$@"; }
    as_super -tAc "SELECT 1" >/dev/null 2>&1 \
      || fail "No se pudo conectar como '$SUPERUSER'. Revisa la contraseña (o define PGSUPERUSER si usas otro usuario)."
    ok "Conectado como superusuario '$SUPERUSER'"

    # Usuario de la aplicación: se crea o se sincroniza su contraseña con la del .env.
    # Las variables psql (:'pass') evitan problemas de comillas e inyección.
    ROLE_EXISTS="$(as_super -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$APP_USER'")"
    if [ "$ROLE_EXISTS" = "1" ]; then
      as_super -q -v pass="$APP_PASS" <<SQL
ALTER ROLE "$APP_USER" WITH LOGIN PASSWORD :'pass';
SQL
      ok "Usuario '$APP_USER' ya existía: contraseña sincronizada con $API_ENV"
    else
      as_super -q -v pass="$APP_PASS" <<SQL
CREATE ROLE "$APP_USER" WITH LOGIN PASSWORD :'pass';
SQL
      ok "Usuario '$APP_USER' creado"
    fi

    for DB in "$APP_DB" "$TEST_DB"; do
      if [ "$(as_super -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB'")" = "1" ]; then
        ok "Base '$DB' ya existe"
      else
        as_super -q -c "CREATE DATABASE \"$DB\" OWNER \"$APP_USER\" ENCODING 'UTF8'"
        ok "Base '$DB' creada"
      fi
    done
    unset SUPERPASS
  fi
fi

# --- 5. Migraciones -----------------------------------------------------------------
step "Aplicando migraciones"
DEV_URL="$(build_url "$APP_USER" "$APP_PASS" "$DB_HOST" "$DB_PORT" "$APP_DB")"
TEST_URL="$(build_url "$APP_USER" "$APP_PASS" "$DB_HOST" "$DB_PORT" "$TEST_DB")"
# El secreto JWT es obligatorio para cargar la configuración de la API.
AUTH_SECRET="$(env_get "$API_ENV" AUTH_ACCESS_TOKEN_SECRET)"

pnpm build:api >/dev/null
DATABASE_URL="$DEV_URL" AUTH_ACCESS_TOKEN_SECRET="$AUTH_SECRET" pnpm --filter @care/api run db:migrate \
  | grep -E "executed successfully|No migrations" || true
ok "Base de desarrollo '$APP_DB' al día"

DATABASE_URL="$TEST_URL" AUTH_ACCESS_TOKEN_SECRET="$AUTH_SECRET" pnpm --filter @care/api run db:migrate \
  | grep -E "executed successfully|No migrations" || true
ok "Base de pruebas '$TEST_DB' al día"

# --- Resumen -------------------------------------------------------------------------
printf '\n%s✔ Entorno listo.%s\n\n' "$GREEN$BOLD" "$RESET"
printf '  Arrancar la aplicación:   %spnpm dev%s\n' "$BOLD" "$RESET"
printf '  Web:                      http://localhost:5173  (crea tu cuenta en /register)\n'
printf '  API / Swagger:            http://localhost:3000/api/docs\n'
printf '  Pruebas con PostgreSQL:   TEST_DATABASE_URL=<url de la base %s> pnpm test\n' "$TEST_DB"
printf '\n  La configuración está en %s (no se sube a git).\n' "$API_ENV"
