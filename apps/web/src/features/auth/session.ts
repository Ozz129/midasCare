import { useSyncExternalStore } from 'react';
import { type SessionState, sessionStore } from './session-store';

export type { SessionState } from './session-store';

/** Estado de sesión actual (loading | authenticated | unauthenticated). */
export function useSession(): SessionState {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot);
}
