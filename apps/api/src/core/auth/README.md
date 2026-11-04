# AuthModule

Autenticación, sesiones y protección de endpoints.

## Endpoints

| Método | Ruta                    | Descripción                                                                  |
| ------ | ----------------------- | ---------------------------------------------------------------------------- |
| POST   | `/api/v1/auth/register` | Crea usuario + espacio individual (tenant) + membresía OWNER. Inicia sesión. |
| POST   | `/api/v1/auth/login`    | Inicia sesión.                                                               |
| POST   | `/api/v1/auth/refresh`  | Rota el refresh token (cookie) y emite un nuevo access token.                |
| POST   | `/api/v1/auth/logout`   | Revoca la sesión y borra la cookie (204).                                    |
| GET    | `/api/v1/auth/me`       | Perfil del usuario autenticado (requiere `Authorization: Bearer`).           |

## Diseño

- **Contraseñas:** `scrypt` de `node:crypto` (N=2^16, r=8, p=1, sal de 16 bytes). Los
  parámetros se guardan junto al hash para poder endurecerlos en el futuro. Comparación
  en tiempo constante. Si el correo no existe, también se calcula un hash para que el
  tiempo de respuesta no revele qué cuentas existen.
- **Access token:** JWT HS256 firmado con `AUTH_ACCESS_TOKEN_SECRET`. Lleva emisor y
  audiencia, y su vida es `AUTH_ACCESS_TOKEN_TTL_SECONDS` (15 min por defecto). El frontend
  lo guarda **solo en memoria**.
- **Refresh token:** 256 bits aleatorios.
  - Se guarda solo su SHA-256, en la tabla `auth_sessions`.
  - Viaja en la cookie `mc_refresh`: `httpOnly`, `SameSite=Strict`, `Path=/api/v1/auth`,
    y `Secure` en staging y production.
  - **Rota en cada renovación**, de forma atómica. Un token ya usado o revocado responde 401.
- **Errores:** las credenciales incorrectas siempre devuelven el mismo 401 genérico
  ("Correo o contraseña incorrectos.").
- **Límite de intentos** (`@nestjs/throttler`, por IP):
  - login: 10/min;
  - registro: 5/min;
  - refresh: 60/min.
  - Detrás de un proxy hay que configurar `trust proxy` para que la IP sea la real.
- **Auditoría** (`AuditService`): `auth.register`, `auth.login`, `auth.login_failed` y
  `auth.logout`. Nunca se registran contraseñas ni tokens.
- **Protección de endpoints:** `@UseGuards(JwtAuthGuard)`. Es el único punto que asigna
  `request.user`. Para datos de un tenant se combina con `TenantAccessGuard`.

## Pendiente

- Verificación de correo. Hoy la cuenta queda `ACTIVE` al registrarse.
- Recuperación y cambio de contraseña.
- Listado y revocación de sesiones desde la interfaz.
- Detección de reutilización de refresh tokens (revocar toda la sesión).
