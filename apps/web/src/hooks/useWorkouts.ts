import { useQuery } from '@tanstack/react-query';
import { useAdapter } from '@/adapters';

export function useWorkoutPlans() {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['workouts', 'plans'],
    queryFn: () => adapter.fetchWorkoutPlans(),
  });
}

export function useActivePlan() {
  const adapter = useAdapter();
  return useQuery({
    queryKey: ['workouts', 'active-plan'],
    queryFn: () => adapter.fetchActivePlan(),
  });
}
