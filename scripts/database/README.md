# scripts/database

Las operaciones de base de datos se lanzan desde los scripts de la raíz y se delegan en
`@care/api` (CLI de TypeORM sobre el código compilado):

| Comando                                  | Acción                                          |
| ---------------------------------------- | ----------------------------------------------- |
| `pnpm db:up` / `pnpm db:down`            | PostgreSQL local (Docker Compose).              |
| `pnpm db:migrate`                        | Compila la API y aplica migraciones pendientes. |
| `pnpm db:revert`                         | Revierte **solo** la última migración.          |
| `pnpm db:migration:create <ruta/Nombre>` | Crea una migración vacía.                       |

Por diseño, no hay scripts que borren bases de datos ni volúmenes. Si en el futuro se
añaden seeds de desarrollo, irán aquí y deberán negarse a ejecutarse cuando
`NODE_ENV=production`.
