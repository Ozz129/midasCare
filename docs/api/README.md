# API REST

- Prefijo: `/api/v1` (constante `API_PREFIX` en `@care/api-contracts`).
- Formato: JSON. Los errores siguen siempre `ApiErrorResponse`:

```json
{
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "Ruta no encontrada",
  "path": "/api/v1/ejemplo",
  "timestamp": "2026-01-31T10:00:00.000Z"
}
```

- Tenant activo: cabecera `x-tenant-id`, validada siempre en el servidor.
- Documentación interactiva (solo en development o con `SWAGGER_ENABLED=true`):
  `/api/docs`, con el JSON de OpenAPI en `/api/docs-json`.

## Endpoints

Todas las rutas llevan el prefijo `/api/v1`.

| Método | Ruta             | Estado           | Acceso  | Descripción                                          |
| ------ | ---------------- | ---------------- | ------- | ---------------------------------------------------- |
| GET    | `/health`        | **Implementado** | Público | Liveness + estado de la BD (`up`/`down`).            |
| POST   | `/auth/register` | **Implementado** | Público | Crea cuenta + espacio individual. Inicia sesión.     |
| POST   | `/auth/login`    | **Implementado** | Público | Inicia sesión.                                       |
| POST   | `/auth/refresh`  | **Implementado** | Cookie  | Rota el refresh token y emite un nuevo access token. |
| POST   | `/auth/logout`   | **Implementado** | Cookie  | Revoca la sesión (204).                              |
| GET    | `/auth/me`       | **Implementado** | Bearer  | Perfil del usuario autenticado.                      |
| GET    | `/tenants`       | **Implementado** | Bearer  | Espacios de trabajo del usuario, con su rol.         |
| GET    | `/users/me`      | Previsto         | —       |                                                      |
| PATCH  | `/users/me`      | Previsto         | —       |                                                      |
| GET    | `/tenants/:id`   | Previsto         | —       |                                                      |
| PATCH  | `/tenants/:id`   | Previsto         | —       |                                                      |

- **Bearer:** cabecera `Authorization: Bearer <accessToken>`, con el token devuelto por
  login, registro o refresh.
- **Cookie:** `mc_refresh`, que es `httpOnly` y la gestiona el navegador. Las peticiones
  deben enviarse con `credentials: 'include'`.

Los endpoints previstos **no están registrados** (responden 404) y no aparecen en Swagger.
Detalles del diseño en [apps/api/src/core/auth/README.md](../../apps/api/src/core/auth/README.md).
