import { useQuery } from '@tanstack/react-query';
import { useAdapter } from '@/adapters';

export function useSessions() {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => adapter.fetchSessions(),
  });
}

export function useSession(id: string) {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => adapter.fetchSession(id),
    enabled: !!id,
  });
}
