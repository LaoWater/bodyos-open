import { useQuery } from '@tanstack/react-query';
import { useAdapter } from '@/adapters';

export function useProfile() {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => adapter.fetchProfile(),
  });
}
