import { useQuery } from '@tanstack/react-query';
import { useAdapter } from '@/adapters';

export function useAchievements() {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['achievements'],
    queryFn: () => adapter.fetchAchievements(),
  });
}
