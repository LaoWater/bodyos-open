import { useQuery } from '@tanstack/react-query';
import { useAdapter } from '@/adapters';

export function useCheckpoints() {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['checkpoints'],
    queryFn: () => adapter.fetchCheckpoints(),
  });
}

export function useCheckpoint(id: string) {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['checkpoints', id],
    queryFn: () => adapter.fetchCheckpoint(id),
    enabled: !!id,
  });
}
