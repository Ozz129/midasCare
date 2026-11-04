import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../../services/api/client';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Solo se reintentan errores de red o del servidor; nunca 4xx (401, 403, 404...).
        retry: (failureCount, error) =>
          failureCount < 2 && (!(error instanceof ApiError) || error.isRetryable),
      },
      mutations: {
        retry: false,
      },
    },
  });
}
