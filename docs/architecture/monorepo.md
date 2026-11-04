# Monorepo

## Herramientas

- **pnpm 12 workspaces** (sin Nx ni Turborepo). Un único `pnpm-lock.yaml`.
- `pnpm-workspace.yaml` define los workspaces, el **catálogo** de versiones compartidas
  (`typescript`, `@types/node`, `vitest`) y las decisiones sobre scripts de instalación
  (`allowBuilds`).
- pnpm 12 verifica el lockfile con una **política de edad mínima de publicación**. Si un
  paquete es demasiado reciente, se fija una versión anterior en lugar de añadir
  excepciones (por ejemplo, Tailwind se fijó en 4.3.3).

## Paquetes

| Paquete               | Tipo      | Depende de              | Consumido por         |
| --------------------- | --------- | ----------------------- | --------------------- |
| `@care/config`        | config    | —                       | todos (dev)           |
| `@care/shared-types`  | ESM lib   | —                       | contracts, utils, api |
| `@care/shared-utils`  | ESM lib   | shared-types            | api                   |
| `@care/api-contracts` | ESM lib   | shared-types            | api, web, (mobile)    |
| `@care/api`           | app (CJS) | contracts, types, utils | —                     |
| `@care/web`           | app (ESM) | contracts               | —                     |

No hay dependencias circulares. Los paquetes internos se enlazan con `workspace:*`.

### Reglas de los paquetes compartidos

- Sin dependencias de NestJS, React ni TypeORM.
- `api-contracts` solo expone tipos y constantes públicas, **nunca entidades de
  persistencia** ni datos sensibles (por ejemplo, no hay `passwordHash`).
- Se compilan a `dist/` (ESM + `.d.ts`) y se exponen con `exports`.
- Los enums se escriben como objetos `as const` + tipo unión (`erasableSyntaxOnly`).

## TypeScript

- `tsconfig.base.json` (raíz): opciones estrictas comunes.
- `@care/config/tsconfig/{library,nest,react}.json`: opciones específicas de cada tipo
  de workspace.
- Cada workspace extiende ambos:
  `"extends": ["../../tsconfig.base.json", "@care/config/tsconfig/<preset>.json"]`.
  Los presets no extienden la base por ruta relativa porque Vite (oxc) resuelve esa ruta
  a través del symlink de `node_modules`.

## Orden de compilación

`pnpm build` ejecuta `pnpm -r run build`, que respeta el orden topológico:
`shared-types → (api-contracts, shared-utils) → (api, web)`.
`dev`, `typecheck` y `test` compilan antes los paquetes (`build:packages`), porque las
apps los consumen desde `dist/`. En `pnpm dev` los paquetes quedan en modo `--watch`.
Vite recarga los cambios. La API, en cambio, debe reiniciarse si cambian los contratos.

## Añadir un workspace

1. Crea `apps/<nombre>` o `packages/<nombre>` con un `package.json` `@care/<nombre>`.
2. Si es una app nueva, añádela a `pnpm-workspace.yaml` (las apps se listan una a una).
3. Extiende el preset de TypeScript que corresponda y declara los scripts estándar
   (`build`, `dev`, `typecheck`, `test`).
