# Módulos de negocio / clínicos

Aquí vivirán los módulos clínicos. **Todavía no hay ninguno implementado**: no hay
entidades, controladores, servicios ni endpoints.

## Módulos previstos

| Módulo                | Responsabilidad (prevista)                                  |
| --------------------- | ----------------------------------------------------------- |
| `patients`            | Pacientes del tenant.                                       |
| `clinical-records`    | Historia clínica electrónica de cada paciente.              |
| `encounters`          | Consultas / sesiones.                                       |
| `clinical-entries`    | Evoluciones y registros dentro de una consulta o historia.  |
| `clinical-templates`  | Plantillas por especialidad (psicología primero).           |
| `clinical-forms`      | Formularios clínicos dinámicos.                             |
| `clinical-signatures` | Firma de registros clínicos (inmutabilidad y trazabilidad). |

## Reglas para añadir un módulo

1. Crea `src/modules/<nombre>/` siguiendo el patrón `module/controller/service/repository/dto/entities/policies`.
2. Las entidades de datos clínicos extienden `TenantScopedEntity` (llevan `tenant_id`).
3. Los controladores usan el `AuthGuard` (cuando exista) + `TenantAccessGuard` y toman el
   tenant **solo** de `@CurrentTenant()`.
4. Los repositorios filtran **siempre** por `tenantId`.
5. Las operaciones relevantes se registran con `AuditService` (sin contenido clínico en
   `metadata`).
6. La autorización clínica específica va en `policies/` del propio módulo.
7. Importa los módulos Core que necesites. **El Core nunca importa módulos clínicos.**
8. Registra el módulo en `AppModule`, genera su migración y documenta sus endpoints en
   Swagger y en `@care/api-contracts`.
