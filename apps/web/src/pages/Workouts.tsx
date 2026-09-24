import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useWorkoutPlans, useActivePlan } from '@/hooks/useWorkouts';
import { cn } from '@/lib/utils';
import { Dumbbell, ChevronRight, Play } from 'lucide-react';

export default function Workouts() {
  const [tab, setTab] = useState<'active' | 'library'>('active');
  const navigate = useNavigate();
  const { data: activePlan, isLoading: activeLoading } = useActivePlan();
  const { data: allPlans, isLoading: plansLoading } = useWorkoutPlans();

  return (
    <PageContainer title="Workouts" subtitle="Your training plans and workout sessions">
      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        {(['active', 'library'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-[8px] transition-colors capitalize',
              tab === t
                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                : 'text-text-secondary hover:bg-bg-tertiary'
            )}
          >
            {t === 'active' ? 'Active Plan' : 'Plan Library'}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        <>
          {activeLoading ? (
            <CardSkeleton />
          ) : activePlan ? (
            <div className="space-y-4">
              {/* Plan header */}
              <GlassCard variant="elevated" className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-[12px] bg-accent-primary/15 flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-accent-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-xl font-bold text-text-primary">{activePlan.name}</h2>
                      <Badge variant="success">Active</Badge>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{activePlan.goal}</p>
                    <p className="text-xs text-text-tertiary mt-1">{activePlan.daysPerWeek} days/week</p>
                  </div>
                </div>
              </GlassCard>

              {/* Day cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {activePlan.days.map((day) => (
                  <GlassCard key={day.id} hover className="p-5" onClick={() => navigate(`/app/workout-session/${day.id}`)}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display text-base font-bold text-text-primary">{day.name}</h3>
                      <ChevronRight className="w-4 h-4 text-text-tertiary" />
                    </div>
                    <p className="text-xs text-text-secondary mb-3">{day.muscleGroups.join(', ')}</p>
                    <div className="space-y-1.5">
                      {day.exercises.map((ex) => (
                        <div key={ex.id} className="flex items-center justify-between text-xs">
                          <span className="text-text-primary">{ex.name}</span>
                          <span className="text-text-tertiary font-mono">{ex.sets} × {ex.repsRange}</span>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" className="w-full mt-4" icon={<Play className="w-3 h-3" />}>
                      Start Session
                    </Button>
                  </GlassCard>
                ))}
              </div>
            </div>
          ) : (
            <GlassCard className="p-8 text-center">
              <Dumbbell className="w-10 h-10 text-text-tertiary mx-auto mb-4" />
              <h3 className="font-display text-lg font-bold text-text-primary mb-2">No Active Plan</h3>
              <p className="text-sm text-text-secondary mb-4">
                Browse the plan library or ask your coach to create a personalized plan.
              </p>
              <Button variant="secondary" onClick={() => setTab('library')}>Browse Plans</Button>
            </GlassCard>
          )}
        </>
      )}

      {tab === 'library' && (
        <>
          {plansLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPlans?.map((plan) => (
                <GlassCard key={plan.id} hover className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-display text-base font-bold text-text-primary">{plan.name}</h3>
                    {plan.isActive && <Badge variant="success">Active</Badge>}
                  </div>
                  <p className="text-xs text-text-secondary mb-3">{plan.goal}</p>
                  <div className="flex items-center gap-4 text-xs text-text-tertiary">
                    <span>{plan.daysPerWeek} days/week</span>
                    <span>{plan.days.length} workouts</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
