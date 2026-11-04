# Visión general de la arquitectura

## Principios

1. **Monorepo** (pnpm workspaces) con aplicaciones y paquetes compartidos.
2. **Monolito modular** en el backend: una sola aplicación NestJS que se despliega como
   una unidad, con límites claros entre módulos.
3. **Una única API REST** (`/api/v1`) para la web y las futuras apps móviles.
4. **Core transversal**: módulos reutilizables (auth, users, tenants, memberships,
   access-control, professionals, files, audit) que **nunca** dependen de módulos clínicos.
5. **Módulos clínicos** separados en `apps/api/src/modules/`, que se añadirán poco a poco.
6. **Multi-tenant** sobre una base PostgreSQL compartida con `tenant_id`.
7. **Contratos compartidos** (`@care/api-contracts`) sin exponer entidades de persistencia.
8. **Seguridad desde el diseño**: fail-closed, validación de entrada, errores sin detalles
   internos y CORS explícito.
9. **Simplicidad**: sin microservicios, CQRS, event sourcing ni Kubernetes.

## Vista de componentes

```text
 ┌─────────────┐   ┌──────────────────┐
 │  apps/web   │   │ apps/mobile (fut.)│
 └──────┬──────┘   └────────┬─────────┘
        │  HTTPS + JSON (@care/api-contracts)
        ▼
 ┌──────────────────────────────────────────────┐
 │ apps/api (NestJS)                 /api/v1    │
 │  common/      filtros, pipes, decoradores    │
 │  core/        auth · users · tenants ·       │
 │               memberships · access-control · │
 │               professionals · files · audit  │
 │  modules/     (clínicos, futuros)            │
 │  infrastructure/ database · storage · security│
 └──────┬───────────────────────────┬───────────┘
        ▼                           ▼
   PostgreSQL                 Almacenamiento local
   (TypeORM, migraciones)     (privado, por tenant)
```

## Multi-tenancy

- Cada entidad de negocio que pertenece a una organización tiene `tenant_id`
  (`TenantScopedEntity`).
- Un usuario puede pertenecer a varios tenants mediante `memberships`, con un rol y un
  estado propios en cada uno.
- El cliente indica el tenant activo con la cabecera `x-tenant-id`. **El backend nunca
  confía solo en esa cabecera**: `TenantAccessGuard` la valida contra una membresía
  `ACTIVE` del usuario autenticado y publica un `TenantContext` validado.
- Toda consulta sobre datos de un tenant debe filtrar por el `tenantId` del
  `TenantContext`, como hace `FilesRepository.findInTenant`. Un recurso de otro tenant se
  trata como inexistente.
- Los permisos se evalúan dentro del tenant (rol de la membresía). La autorización clínica
  más fina se hará con _policies_ dentro de cada módulo clínico.

Tipos de tenant: `INDIVIDUAL` (profesional independiente) y `ORGANIZATION` (clínica).

## Identidad y perfil profesional

- `users`: identidad global (correo, nombre, estado y hash de contraseña, que nunca se
  selecciona por defecto).
- `professional_profiles`: datos profesionales (nombre visible, matrícula, especialidades).
  Está separado de la identidad.
- La relación profesional ↔ organización se expresa con `memberships` (rol `PROFESSIONAL`).

## Estado

Ver la sección _Estado del MVP_ del [README](../../README.md).
