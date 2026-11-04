# apps/mobile

Esta carpeta alojará las **futuras aplicaciones móviles** de MIDAS CARE. Probablemente
serán dos:

```text
apps/mobile/
├── clinician/   App para profesionales de salud
└── patient/     App para pacientes
```

## Estado

- **Todavía no se ha elegido tecnología** (React Native, Expo, Flutter u otra) y no hay
  nada instalado.
- La carpeta no forma parte de los workspaces de pnpm hasta que contenga una aplicación.

## Principios

- Las apps móviles usarán **la misma API REST** (`/api/v1`). **No habrá una API móvil
  separada.**
- Reutilizarán los contratos públicos de `@care/api-contracts`, que no dependen de
  React ni de NestJS.
- Cuando se cree una app, se añadirá su ruta (por ejemplo `apps/mobile/clinician`) a
  `pnpm-workspace.yaml`.
