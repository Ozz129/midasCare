import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../../../services/api';

export function useApiHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => healthApi.get(signal),
    refetchInterval: 30_000,
  });
}
