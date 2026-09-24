import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { useActivePlan } from '@/hooks/useWorkouts';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Dumbbell } from 'lucide-react';

export default function Exercises() {
  const { data: plan, isLoading } = useActivePlan();

  // Collect all unique exercises from the active plan
  const exercises = plan?.days.flatMap((day) =>
    day.exercises.map((ex) => ({
      ...ex,
      dayName: day.name,
      muscleGroups: day.muscleGroups,
    }))
  ) ?? [];

  return (
    <PageContainer title="Exercises" subtitle="Exercise library from your active plan">
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : exercises.length > 0 ? (
        <div className="space-y-3">
          {exercises.map((ex) => (
            <GlassCard key={ex.id} className="p-4" hover>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[10px] bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                  <Dumbbell className="w-5 h-5 text-accent-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-text-primary">{ex.name}</h3>
                    <Badge variant="neutral">{ex.dayName}</Badge>
                  </div>
                  <p className="text-xs text-text-tertiary mb-2">
                    {ex.sets} sets × {ex.repsRange} &middot; Rest {ex.restSeconds}s
                  </p>
                  <div className="px-3 py-2 bg-accent-primary/5 rounded-[6px] border border-accent-primary/10">
                    <p className="text-xs text-text-secondary">{ex.coachingCues}</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-8 text-center">
          <Dumbbell className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary">No exercises found. Activate a workout plan first.</p>
        </GlassCard>
      )}
    </PageContainer>
  );
}
