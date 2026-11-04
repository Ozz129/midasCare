# Decisiones de arquitectura

## CARE-001 a CARE-028

El diseño previo de MIDAS CARE recoge las decisiones arquitectónicas **CARE-001 a
CARE-028**. **No todas forman parte del MVP.**

El contenido completo de esas decisiones **no está en este repositorio** y no se ha
reconstruido para no inventarlo. Cuando se incorpore, cada decisión irá en su propio
archivo (`CARE-0NN-titulo.md`) con este formato:

```markdown
# CARE-0NN: Título

- Estado: propuesta | aceptada | reemplazada por CARE-0XX | fuera del MVP
- Fecha:

## Contexto

## Decisión

## Consecuencias
```

## Decisiones técnicas de la implementación inicial

Se tomaron al montar la base del monorepo y están documentadas en `docs/architecture/`.
Se pueden revisar sin reorganizar la aplicación.

| Tema                   | Decisión                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------- |
| TypeScript             | 6.0.x (TS 7 todavía no es compatible con typescript-eslint).                           |
| Formato de módulos API | CommonJS sobre Node 24 con `require(esm)` (NestJS 12 es ESM-only).                     |
| Configuración          | Validación propia con class-validator + `process.loadEnvFile()`, sin `@nestjs/config`. |
| UUID                   | `gen_random_uuid()` de PostgreSQL ≥ 13, sin extensiones.                               |
| Enumeraciones en BD    | `varchar` validado en la aplicación, no tipos `ENUM` de PostgreSQL.                    |
| Roles de membresía     | `OWNER`, `ADMIN`, `PROFESSIONAL`, `STAFF`: **provisionales**.                          |
| Tenant activo          | Cabecera `x-tenant-id`, siempre validada contra la membresía.                          |
| Endpoints no listos    | No se registran (404) ni aparecen en Swagger, en lugar de responder 501.               |
