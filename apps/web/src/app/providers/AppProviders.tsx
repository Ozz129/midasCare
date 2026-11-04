import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { restoreSession, sessionStore } from '../../features/auth/session-store';
import { createQueryClient } from './query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    // Restaura la sesión desde la cookie de refresh al cargar la aplicación.
    restoreSession();

    // Al cerrar o perder la sesión se descarta toda la caché de datos del usuario.
    return sessionStore.subscribe(() => {
      if (sessionStore.getSnapshot().status === 'unauthenticated') queryClient.clear();
    });
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
