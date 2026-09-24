import { useQuery } from '@tanstack/react-query';
import { useAdapter } from '@/adapters';

export function useActivityFeed() {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['activity', 'feed'],
    queryFn: () => adapter.fetchActivityFeed(),
  });
}
