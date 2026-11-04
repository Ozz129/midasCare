# Frontend (`apps/web`)

React 19 + Vite 8 + TypeScript, React Router 8, TanStack Query 5, Tailwind CSS 4 e iconos
Lucide. Dirección visual: **Clinical Calm + MIDAS Gold**.

## Organización

```text
src/
├── main.tsx                  Fuente Inter (autoalojada), estilos globales, providers y router
├── app/
│   ├── providers/            QueryClient (sin reintentar 4xx) y AppProviders
│   ├── router/               rutas + metadatos (route-meta), ProtectedRoute, errores, 404
│   └── layouts/              AppLayout (sidebar + header), AuthLayout (dos columnas)
├── components/
│   ├── brand/BrandLogo.tsx   Logotipos oficiales (full/compact/vertical × dark/light)
│   ├── layout/               Sidebar, SidebarNav, MobileNavigation, Header, PageHeader, navigation.ts
│   └── ui/                   Biblioteca de componentes base (ver abajo)
├── features/
│   ├── auth/                 LoginPage, login-validation.ts, session.ts
│   ├── dashboard/            DashboardPage + StatCard, RecentActivityCard, QuickActionsCard, SystemStatusCard
│   ├── settings/             SettingsPage (ruta protegida)
│   └── design-system/        Guía de componentes (solo desarrollo)
├── services/api/             cliente HTTP centralizado (createApiClient, ApiError)
├── hooks/  utils/
└── styles/
    ├── tokens.css            Design tokens (@theme de Tailwind v4)
    └── globals.css           Tailwind, utilidades del sistema y estilos base
```

## Marca

Los logotipos oficiales están en `src/assets/brand/` y se usan **sin recomponer ni
recolorear** a través de `BrandLogo`:

| Archivo                        | Uso                                      | `BrandLogo`                      |
| ------------------------------ | ---------------------------------------- | -------------------------------- |
| `midas-care-logo.png`          | Horizontal a color (fondos claros)       | `variant="full"`                 |
| `midas-care-logo-vertical.png` | Vertical a color (login móvil)           | `variant="vertical"`             |
| `midas-care-symbol.png`        | Isotipo a color (header móvil)           | `variant="compact"`              |
| `midas-care-logo-white.png`    | Monocromo blanco (sidebar, paneles navy) | `tone="light"`                   |
| `midas-care-symbol-white.png`  | Isotipo monocromo blanco                 | `variant="compact" tone="light"` |
| `midas-care-app-icon.png`      | Icono de app                             | —                                |
| `midas-tech-symbol.png`        | Símbolo MIDAS TECH (M dorada)            | `MidasTechLogo`                  |
| `midas-tech-logo.png`          | Logotipo completo MIDAS TECH             | — (guía de componentes)          |

**MIDAS TECH** (`components/brand/MidasTechLogo.tsx`): firma corporativa con el símbolo
dorado y "Midas Tech". El logotipo está diseñado sobre negro y su dorado pierde contraste
sobre fondos claros, por eso:

- `variant="inline"` solo se usa sobre superficies oscuras (panel navy del login);
- `variant="badge"` lo envuelve en una pastilla oscura para fondos claros (login móvil).

`public/favicon.png` (48 px) y `public/apple-touch-icon.png` (180 px) salen del icono de
app.

Estos archivos se extrajeron de la lámina de marca, que es un PNG de 1536×1024. Su
resolución es limitada: el horizontal mide 941 px de ancho, el monocromo 422 px y el
icono de app 179 px. **Cuando estén disponibles los originales vectoriales (SVG) o PNG
de alta resolución, basta con reemplazar estos archivos manteniendo el nombre.**

No existe una versión vertical monocroma oficial. `variant="vertical" tone="light"` usa
el horizontal blanco.

## Design tokens

Todos los tokens están en `styles/tokens.css`, dentro del bloque `@theme` de Tailwind v4.
La paleta por defecto de Tailwind **se elimina** (`--color-*: initial`), así que los
componentes solo pueden usar colores semánticos (`bg-primary`, `text-muted`,
`border-border`...). No hay HEX en los componentes.

| Grupo       | Tokens                                                                                                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marca       | `primary` #137C78, `primary-hover` #0D625F, `primary-soft` #E8F5F1, `primary-on-dark`, `navy` #18334A, `gold` #C6A052, `gold-dark` #A47B30, `gold-soft` #F8F1E3 |
| Neutros     | `background` #F7F9FA, `surface` #FFF, `surface-muted`, `border` #E2E8ED, `input-border`, `text` #263746, `muted` #64748B, `overlay`                             |
| Estados     | `success` / `-soft` / `-strong`, `warning` / `-soft`, `danger` / `-soft`, `info` / `-soft`                                                                      |
| Tipografía  | `display` 32, `page-title` 28, `section-title` 20, `card-title` 17, `body-lg` 16, `body` 15, `label` 14, `helper` 13, `caption` 12                              |
| Dimensiones | `sidebar` 264px, `header` 64px, `control` 44px, `control-sm` 36px, `content` 1200px                                                                             |
| Radios      | `control` 8px, `card` 12px, `dialog` 16px, `pill`                                                                                                               |
| Sombras     | `card`, `raised`, `overlay`                                                                                                                                     |
| Movimiento  | `ease-standard`, `animate-fade-in`, `animate-slide-in-left`; se respeta `prefers-reduced-motion`                                                                |
| Breakpoints | `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1440                                                                                                        |
| Foco        | utilidades `focus-ring` y `focus-ring-on-dark`                                                                                                                  |

Tokens derivados que no estaban en la paleta original y por qué existen:

- `primary-on-dark`: el texto CARE sobre navy necesita 7:1; `primary` solo da 2.6:1.
- `success-strong`: el texto de éxito sobre `success-soft` necesita al menos 4.5:1.
- `input-border`: los bordes de los campos necesitan 3:1 (WCAG 1.4.11).

### Reglas de color

- **El dorado es identidad de marca.** No representa estados clínicos. Como texto solo se
  usa sobre `navy` (5.3:1). Sobre blanco, el dorado da 2.5:1 y solo sirve como decoración.
- Los estados se expresan con color semántico **más icono y texto**, nunca solo con color.
  Ver `RecordStatusBadge`, `Alert` y `SaveIndicator`.
- Las ratios de contraste verificadas están documentadas al inicio de `tokens.css`.

## Componentes base (`components/ui`)

| Componente                      | Notas                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `Button` (+ `buttonClassName`)  | primary · secondary · outline · ghost · destructive; sm/md/lg/icon; `loading`          |
| `Input`, `Textarea`, `Select`   | Etiqueta permanente, ayuda, error asociado (`aria-describedby`), obligatorio accesible |
| `Checkbox`                      | Nativo con estilo; descripción y error                                                 |
| `Badge`, `RecordStatusBadge`    | Tonos semánticos; estados de registro (Borrador, Pendiente de firma, Firmado)          |
| `SaveIndicator`                 | Sin guardar / Guardando / Guardado / Error (`aria-live`)                               |
| `Card`, `CardHeader`            | Radio 12px, borde discreto, sombra mínima                                              |
| `Alert`, `EmptyState`           | Mensajes con icono; estados vacíos honestos                                            |
| `Dialog`                        | `<dialog>` nativo: foco atrapado, Escape, fondo; modo panel lateral                    |
| `DropdownMenu`                  | Patrón ARIA "menu button" con navegación por teclado                                   |
| `Tabs`                          | Patrón ARIA "tabs" con tabindex itinerante                                             |
| `Table`                         | Región desplazable horizontalmente, con nombre y caption                               |
| `Tooltip`                       | Hover y foco, se descarta con Escape (WCAG 1.4.13)                                     |
| `Avatar`, `Skeleton`, `Spinner` |                                                                                        |

No se instaló ninguna librería de UI: los componentes interactivos usan HTML nativo y
ARIA. Las únicas dependencias nuevas son `lucide-react` (iconos) y
`@fontsource-variable/inter` (fuente autoalojada, sin peticiones a terceros).

La **guía de componentes** está en `/design-system`. Solo existe en desarrollo y no se
incluye en el build de producción.

## Layout y navegación

- **≥ 1024px**: sidebar fijo (navy) a la izquierda, header superior y área de contenido.
- **< 1024px**: el sidebar pasa a ser un panel lateral modal (`MobileNavigation`), y el
  header es compacto.
- Las secciones clínicas (Pacientes, Historias clínicas, Atenciones) aparecen como
  **"Pronto"**: no tienen ruta ni llevan a pantallas falsas.
- El header muestra el título y las migas de la ruta activa (declarados en `handle` de
  cada ruta), el espacio de trabajo real (`GET /tenants`) con su rol, y el menú de
  usuario con nombre, correo, Configuración y Cerrar sesión.

## Rutas

| Ruta             | Acceso              | Descripción                                                         |
| ---------------- | ------------------- | ------------------------------------------------------------------- |
| `/login`         | Solo sin sesión     | Login contra `POST /auth/login`. Con sesión, redirige al panel.     |
| `/register`      | Solo sin sesión     | Registro contra `POST /auth/register`. Al terminar, entra al panel. |
| `/`              | Protegida           | Panel principal.                                                    |
| `/settings`      | Protegida           | Perfil y espacios de trabajo (solo lectura).                        |
| `/design-system` | Protegida, solo dev | Guía de componentes.                                                |
| `*`              | Pública             | 404.                                                                |

Una ruta protegida sin sesión redirige a `/login`. Tras iniciar sesión, el usuario vuelve
a la ruta que había pedido.

## Registro y acceso con proveedores externos

- `RegisterPage` valida en el cliente con las mismas reglas que el servidor
  (`register-validation.ts`):
  - nombre, apellidos y correo obligatorios;
  - contraseña de 12 a 128 caracteres, con confirmación;
  - nombre de la consulta opcional.
- Muestra un indicador de seguridad de la contraseña con barra y texto, que no depende
  solo del color. Se basa en la longitud y no impone reglas de composición, siguiendo la
  guía NIST SP 800-63B.
- Si el correo ya existe (409), marca ese campo y ofrece ir a iniciar sesión.
- `SocialAuthButtons` muestra Google y Microsoft en login y registro como **marcadores
  visibles y deshabilitados** ("Pronto"). No inician ningún flujo OAuth. Se conectarán
  cuando el backend implemente OpenID Connect.

## Sesión (`features/auth`)

- `session-store.ts`: estado en **memoria** (`loading` | `authenticated` |
  `unauthenticated`), al que se accede con `useSession()` (`useSyncExternalStore`).
  - El access token **nunca** se guarda en `localStorage` ni en `sessionStorage`.
  - El refresh token vive en una cookie `httpOnly` que JavaScript no puede leer.
- Al cargar la app, `restoreSession()` llama a `POST /auth/refresh`. Si la cookie es
  válida, la sesión se restaura; mientras tanto se muestra un indicador de carga.
- `apiClient` adjunta `Authorization: Bearer`. Ante un 401, renueva la sesión **una vez**
  y repite la petición. Las renovaciones simultáneas comparten una sola petición, porque
  el refresh token rota en cada uso.
- `signOut()` revoca la sesión en la API y borra la caché de TanStack Query.

## Datos

- `StatCard` recibe `value: number | null`. `null` significa "aún no hay fuente de datos" y
  muestra un estado vacío, **nunca un número inventado**. Para conectarla a la API, basta
  con pasarle el resultado de una query de TanStack Query (`value`, `isLoading`).
- `SystemStatusCard` muestra el estado real de la API (`GET /api/v1/health`).
- `useUserTenants()` (`features/tenants`) obtiene los espacios de trabajo del usuario.

## Accesibilidad (objetivo WCAG 2.2 AA)

- Foco visible en todos los elementos interactivos y enlace "Saltar al contenido".
- Controles de 44px de alto como objetivo táctil.
- Cada campo tiene una etiqueta asociada y sus errores enlazados.
- Al enviar un formulario con errores, el foco va al primer campo inválido.
- Un solo `h1` por vista.
- Se respeta `prefers-reduced-motion`.
