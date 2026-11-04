# @care/config

Configuración de herramientas compartida por todo el monorepo:

| Export                               | Uso                                                                 |
| ------------------------------------ | ------------------------------------------------------------------- |
| `@care/config/prettier`              | Configuración Prettier (referenciada desde el `package.json` raíz). |
| `@care/config/tsconfig/library.json` | Paquetes compartidos ESM (`packages/*`).                            |
| `@care/config/tsconfig/nest.json`    | Backend NestJS (`apps/api`).                                        |
| `@care/config/tsconfig/react.json`   | Frontend React + Vite (`apps/web`).                                 |

Todos los presets extienden `tsconfig.base.json` de la raíz (modo `strict`).
Este paquete no contiene código de ejecución.
