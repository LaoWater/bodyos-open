import { useNavigate } from 'react-router';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { QuickActionCard } from '@/components/features/QuickActionCard';
import { StreakBadge } from '@/components/features/StreakBadge';
import { ActivityCard } from '@/components/features/ActivityCard';
import { BodyBlueprint } from '@/components/charts/BodyBlueprint';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useProfile } from '@/hooks/useProfile';
import { useActivePlan } from '@/hooks/useWorkouts';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { getGreeting } from '@/lib/utils';
import { Scan, Video, MessageCircle, Dumbbell, ChevronRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: activePlan, isLoading: planLoading } = useActivePlan();
  const { data: checkpoints, isLoading: checkpointsLoading } = useCheckpoints();
  const { data: activityFeed, isLoading: activityLoading } = useActivityFeed();

  const latestCheckpoint = checkpoints?.[0];
  const todayDay = activePlan?.days?.[0]; // Simplified: show first day

  return (
    <PageContainer
      title={`${getGreeting()}, ${profile?.name?.split(' ')[0] || 'Athlete'}`}
      action={<StreakBadge count={profile?.streak ?? 0} />}
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        <QuickActionCard
          icon={<Scan className="w-7 h-7" />}
          label="Body Scan"
          subtitle="AI intelligence"
          tint="rgba(78, 205, 196, 0.12)"
          onClick={() => navigate('/app/body-intelligence')}
        />
        <QuickActionCard
          icon={<Video className="w-7 h-7" />}
          label="Record"
          subtitle="Film your set"
          tint="rgba(231, 76, 60, 0.10)"
          onClick={() => navigate('/app/sessions')}
        />
        <QuickActionCard
          icon={<MessageCircle className="w-7 h-7" />}
          label="Ask Coach"
          subtitle="AI guidance"
          tint="rgba(91, 124, 250, 0.12)"
          onClick={() => navigate('/app/coach')}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Workout */}
        <div>
          {planLoading ? (
            <CardSkeleton />
          ) : activePlan && todayDay ? (
            <GlassCard className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-[12px] bg-accent-secondary/15 flex items-center justify-center">
                  <Dumbbell className="w-5 h-5 text-accent-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-bold text-text-primary">{todayDay.name}</h3>
                  <p className="text-sm text-text-secondary">{todayDay.muscleGroups.join(', ')}</p>
                  <p className="text-xs text-accent-primary mt-1">{todayDay.exercises.length} exercises</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-tertiary mt-1" />
              </div>
              <Button
                className="w-full"
                onClick={() => navigate(`/app/workout-session/${todayDay.id}`)}
              >
                Start Workout
              </Button>
            </GlassCard>
          ) : (
            <GlassCard className="p-6">
              <div className="text-center py-4">
                <Dumbbell className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
                <p className="text-sm text-text-secondary mb-3">No workout scheduled</p>
                <Button variant="secondary" size="sm" onClick={() => navigate('/app/workouts')}>
                  Browse Plans
                </Button>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Body Status */}
        <div>
          {checkpointsLoading ? (
            <CardSkeleton />
          ) : latestCheckpoint ? (
            <GlassCard className="p-6" hover onClick={() => navigate(`/app/body-intelligence/${latestCheckpoint.id}`)}>
              <div className="flex items-center gap-5">
                <BodyBlueprint
                  score={latestCheckpoint.score}
                  focusAreas={latestCheckpoint.focusAreas}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-4xl font-bold text-text-primary">
                      {latestCheckpoint.score}
                    </span>
                    <span className="text-sm text-text-secondary">/100 Posture Score</span>
                  </div>
                  {latestCheckpoint.focusAreas.length > 0 && (
                    <p className="text-sm text-warning">
                      {latestCheckpoint.focusAreas.length} focus area{latestCheckpoint.focusAreas.length > 1 ? 's' : ''} detected
                    </p>
                  )}
                  <Button variant="ghost" size="sm" className="mt-3 -ml-3">
                    View Details
                  </Button>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-6 text-center">
              <Scan className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary mb-3">No body checkpoints yet</p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/app/body-intelligence')}>
                Start Checkpoint
              </Button>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <h2 className="font-display text-lg font-bold text-text-primary mb-4">Recent Activity</h2>
        {activityLoading ? (
          <CardSkeleton />
        ) : (
          <GlassCard className="divide-y divide-border-subtle">
            {activityFeed?.slice(0, 5).map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))}
            {(!activityFeed || activityFeed.length === 0) && (
              <div className="p-6 text-center text-sm text-text-secondary">
                No activity yet. Start your first workout!
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </PageContainer>
  );
}
