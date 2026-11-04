import {
  type AuthSessionResponse,
  type RegisterRequest,
  type UserProfileResponse,
} from '@care/api-contracts';
import { authApi } from './auth-api';

export type SessionState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: UserProfileResponse; accessToken: string };

/*
 * Estado de sesión en MEMORIA. El access token nunca se guarda en localStorage
 * ni sessionStorage. Al recargar la página, la sesión se restaura con la cookie
 * httpOnly del refresh token (POST /auth/refresh).
 */
let state: SessionState = { status: 'loading' };
const listeners = new Set<() => void>();

function setState(next: SessionState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

function applySession(session: AuthSessionResponse): void {
  setState({ status: 'authenticated', user: session.user, accessToken: session.accessToken });
}

export const sessionStore = {
  getSnapshot: (): SessionState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function getAccessToken(): string | null {
  return state.status === 'authenticated' ? state.accessToken : null;
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Renueva la sesión con la cookie de refresh. Las llamadas simultáneas comparten
 * la misma petición: el refresh token rota en cada uso y una segunda petición
 * con el token anterior sería rechazada.
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= authApi
    .refresh()
    .then((session) => {
      applySession(session);
      return true;
    })
    .catch(() => {
      setState({ status: 'unauthenticated' });
      return false;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/** Restaura la sesión al arrancar la aplicación (una sola vez). */
export function restoreSession(): void {
  if (state.status === 'loading') void refreshSession();
}

export async function signIn(email: string, password: string): Promise<void> {
  applySession(await authApi.login({ email, password }));
}

/** Refleja en la sesión los cambios del perfil (nombre, foto) sin volver a autenticar. */
export function updateSessionUser(user: UserProfileResponse): void {
  if (state.status === 'authenticated') setState({ ...state, user });
}

/** Crea la cuenta e inicia sesión directamente (el registro devuelve una sesión). */
export async function signUp(data: RegisterRequest): Promise<void> {
  applySession(await authApi.register(data));
}

export async function signOut(): Promise<void> {
  try {
    await authApi.logout();
  } finally {
    // Aunque falle la red, la sesión local se elimina.
    setState({ status: 'unauthenticated' });
  }
}
