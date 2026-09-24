import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { MetricCard } from '@/components/ui/MetricCard';
import { StreakBadge } from '@/components/features/StreakBadge';
import { useProfile } from '@/hooks/useProfile';
import { useSessions } from '@/hooks/useSessions';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Activity, Target, Flame, Scan } from 'lucide-react';

export default function Profile() {
  const { data: profile, isLoading } = useProfile();
  const { data: sessions } = useSessions();
  const { data: checkpoints } = useCheckpoints();

  if (isLoading) return <PageContainer title="Profile"><CardSkeleton /></PageContainer>;

  const avgScore = sessions?.length
    ? Math.round(sessions.reduce((sum, s) => sum + (s.formScore ?? 0), 0) / sessions.length)
    : 0;

  return (
    <PageContainer title="Profile">
      {/* Profile card */}
      <GlassCard className="p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-xl font-bold text-white">
            {profile?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-text-primary">{profile?.name}</h2>
            <p className="text-sm text-text-secondary">{profile?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <StreakBadge count={profile?.streak ?? 0} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          label="Total Sessions"
          value={sessions?.length ?? 0}
        />
        <MetricCard
          icon={<Target className="w-5 h-5" />}
          label="Avg Form Score"
          value={avgScore}
          trend={avgScore > 75 ? { direction: 'up', label: 'Strong form' } : undefined}
        />
        <MetricCard
          icon={<Flame className="w-5 h-5" />}
          label="Best Streak"
          value={profile?.streak ?? 0}
        />
        <MetricCard
          icon={<Scan className="w-5 h-5" />}
          label="Checkpoints"
          value={checkpoints?.length ?? 0}
        />
      </div>

      {/* Goals */}
      <GlassCard className="p-6">
        <h3 className="font-display text-lg font-bold text-text-primary mb-4">Goals & Preferences</h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-text-secondary">Goals:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile?.goals.map((g) => (
                <span key={g} className="px-2.5 py-1 text-xs bg-accent-primary/10 text-accent-primary rounded-full">
                  {g.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-sm text-text-secondary">Schedule:</span>
            <p className="text-sm text-text-primary mt-0.5">
              {profile?.schedule.days.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ')} &middot; {profile?.schedule.timeOfDay} &middot; {profile?.schedule.duration}
            </p>
          </div>
          <div>
            <span className="text-sm text-text-secondary">Equipment:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile?.equipment.map((e) => (
                <span key={e} className="px-2.5 py-1 text-xs bg-bg-tertiary text-text-secondary rounded-full">
                  {e.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </PageContainer>
  );
}
