import { Tooltip } from '../ui/Tooltip';

/*
 * Acceso con proveedores externos — PLACEHOLDER.
 * Los botones son visibles pero están deshabilitados: no inician ningún flujo
 * OAuth ni simulan un acceso. Se conectarán cuando el backend implemente
 * OpenID Connect (Google / Microsoft).
 *
 * Los logotipos usan los colores oficiales de cada marca (excepción deliberada
 * a los tokens del sistema, exigida por sus guías de identidad).
 */

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 21 21" className="size-5" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

const providers = [
  { id: 'google', label: 'Google', Logo: GoogleLogo },
  { id: 'microsoft', label: 'Microsoft', Logo: MicrosoftLogo },
];

/** Separador "o continúa con" + botones de proveedores externos (próximamente). */
export function SocialAuthButtons({ mode }: { mode: 'login' | 'register' }) {
  const verb = mode === 'login' ? 'Continuar' : 'Registrarse';

  return (
    <div>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-caption text-muted">o continúa con</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {providers.map(({ id, label, Logo }) => (
          <li key={id}>
            <Tooltip content="Disponible próximamente" wrapperClassName="flex w-full">
              <button
                type="button"
                aria-disabled="true"
                aria-label={`${verb} con ${label} (disponible próximamente)`}
                className="flex h-control w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-control border border-border bg-surface px-4 text-label font-medium text-text opacity-70 transition-interactive focus-ring"
              >
                <Logo />
                <span>{label}</span>
                <span className="rounded-pill bg-surface-muted px-2 py-0.5 text-caption text-muted">
                  Pronto
                </span>
              </button>
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  );
}
