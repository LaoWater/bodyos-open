import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useActivePlan } from '@/hooks/useWorkouts';
import { cn } from '@/lib/utils';
import { Play, Pause, RotateCcw, Check, Plus } from 'lucide-react';
import type { SetLog } from '@/types/models';

export default function WorkoutSession() {
  const { dayId } = useParams();
  const navigate = useNavigate();
  const { data: plan } = useActivePlan();
  const day = plan?.days.find((d) => d.id === dayId);

  // Set logs: exerciseId -> SetLog[]
  const [setLogs, setSetLogs] = useState<Record<string, SetLog[]>>({});
  const [restTimer, setRestTimer] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Initialize set logs
  useEffect(() => {
    if (!day) return;
    const initial: Record<string, SetLog[]> = {};
    for (const ex of day.exercises) {
      initial[ex.exerciseId] = Array.from({ length: ex.sets }, () => ({
        reps: 0,
        weight: 0,
        rpe: undefined,
        completed: false,
      }));
    }
    setSetLogs(initial);
  }, [day]);

  // Rest timer
  useEffect(() => {
    if (restRunning && restTimer > 0) {
      timerRef.current = setInterval(() => {
        setRestTimer((t) => {
          if (t <= 1) {
            setRestRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [restRunning, restTimer]);

  const startRest = (seconds: number) => {
    setRestDuration(seconds);
    setRestTimer(seconds);
    setRestRunning(true);
  };

  const updateSet = (exerciseId: string, setIndex: number, field: keyof SetLog, value: number | boolean) => {
    setSetLogs((prev) => {
      const sets = [...(prev[exerciseId] || [])];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      return { ...prev, [exerciseId]: sets };
    });
  };

  const addSet = (exerciseId: string) => {
    setSetLogs((prev) => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), { reps: 0, weight: 0, completed: false }],
    }));
  };

  if (!day) {
    return (
      <PageContainer title="Workout Session">
        <GlassCard className="p-8 text-center">
          <p className="text-text-secondary">Workout day not found.</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/app/workouts')}>
            Back to Workouts
          </Button>
        </GlassCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={day.name}
      subtitle={day.muscleGroups.join(', ')}
    >
      {/* Rest Timer */}
      {(restRunning || restTimer > 0) && (
        <GlassCard variant="elevated" className="p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">Rest Timer</span>
            <span className="font-mono text-2xl font-bold text-accent-primary">
              {Math.floor(restTimer / 60)}:{String(restTimer % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={restRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              onClick={() => setRestRunning(!restRunning)}
            >
              {restRunning ? 'Pause' : 'Resume'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => { setRestTimer(restDuration); setRestRunning(true); }}
            >
              Reset
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Exercises */}
      <div className="space-y-6">
        {day.exercises.map((ex) => (
          <GlassCard key={ex.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display text-base font-bold text-text-primary">{ex.name}</h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {ex.sets} sets × {ex.repsRange} &middot; Rest {ex.restSeconds}s
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startRest(ex.restSeconds)}
              >
                Rest {ex.restSeconds}s
              </Button>
            </div>

            {/* Coaching cues */}
            <div className="mb-4 px-3 py-2 bg-accent-primary/5 rounded-[8px] border border-accent-primary/10">
              <p className="text-xs text-text-secondary">{ex.coachingCues}</p>
            </div>

            {/* Set rows */}
            <div className="space-y-2">
              <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 text-xs text-text-tertiary px-1">
                <span>Set</span>
                <span>Reps</span>
                <span>Weight</span>
                <span>RPE</span>
                <span></span>
              </div>
              {(setLogs[ex.exerciseId] || []).map((set, i) => (
                <div
                  key={i}
                  className={cn(
                    'grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 items-center px-1 py-1.5 rounded-[6px]',
                    set.completed && 'bg-success/5'
                  )}
                >
                  <span className="text-sm text-text-secondary font-mono">{i + 1}</span>
                  <input
                    type="number"
                    min={0}
                    value={set.reps || ''}
                    onChange={(e) => updateSet(ex.exerciseId, i, 'reps', Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-bg-tertiary border border-border-subtle rounded text-sm text-text-primary text-center font-mono outline-hidden focus:border-border-strong"
                    placeholder="0"
                  />
                  <input
                    type="number"
                    min={0}
                    value={set.weight || ''}
                    onChange={(e) => updateSet(ex.exerciseId, i, 'weight', Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-bg-tertiary border border-border-subtle rounded text-sm text-text-primary text-center font-mono outline-hidden focus:border-border-strong"
                    placeholder="kg"
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={set.rpe || ''}
                    onChange={(e) => updateSet(ex.exerciseId, i, 'rpe', Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-bg-tertiary border border-border-subtle rounded text-sm text-text-primary text-center font-mono outline-hidden focus:border-border-strong"
                    placeholder="1-10"
                  />
                  <button
                    onClick={() => updateSet(ex.exerciseId, i, 'completed', !set.completed)}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                      set.completed ? 'bg-success text-white' : 'bg-bg-tertiary text-text-disabled hover:text-text-secondary'
                    )}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addSet(ex.exerciseId)}
              className="flex items-center gap-1 mt-2 text-xs text-accent-primary hover:text-accent-primary/80 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Set
            </button>
          </GlassCard>
        ))}
      </div>

      {/* Complete */}
      <div className="mt-8 pb-8">
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            // TODO: Log workout session via adapter
            navigate('/app/workouts');
          }}
        >
          Complete Workout
        </Button>
      </div>
    </PageContainer>
  );
}
