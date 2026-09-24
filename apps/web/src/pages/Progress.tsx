import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActivityCard } from '@/components/features/ActivityCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import { useSessions } from '@/hooks/useSessions';
import { cn, formatDate } from '@/lib/utils';
import { TrendingUp, Camera, BarChart3 } from 'lucide-react';

const tabs = [
  { key: 'timeline' as const, label: 'Timeline', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'photos' as const, label: 'Photos', icon: <Camera className="w-4 h-4" /> },
  { key: 'trends' as const, label: 'Trends', icon: <TrendingUp className="w-4 h-4" /> },
];

export default function Progress() {
  const [tab, setTab] = useState<'timeline' | 'photos' | 'trends'>('timeline');
  const { data: activityFeed, isLoading: feedLoading } = useActivityFeed();
  const { data: checkpoints } = useCheckpoints();
  const { data: sessions } = useSessions();

  return (
    <PageContainer title="Progress" subtitle="Track your journey over time">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[8px] transition-colors',
              tab === t.key
                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                : 'text-text-secondary hover:bg-bg-tertiary'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'timeline' && (
        <>
          {feedLoading ? (
            <CardSkeleton />
          ) : (
            <GlassCard className="divide-y divide-border-subtle">
              {activityFeed?.map((item) => (
                <ActivityCard key={item.id} item={item} />
              ))}
              {(!activityFeed || activityFeed.length === 0) && (
                <div className="p-8 text-center text-sm text-text-secondary">
                  No activity yet.
                </div>
              )}
            </GlassCard>
          )}
        </>
      )}

      {tab === 'photos' && (
        <div>
          {checkpoints && checkpoints.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {checkpoints.flatMap((cp) =>
                cp.photos.map((photo) => (
                  <div key={photo.id} className="relative rounded-[12px] overflow-hidden bg-bg-tertiary aspect-[3/4]">
                    <img
                      src={photo.url}
                      alt={photo.angle.replace('_', ' ')}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-xs text-white/80">{formatDate(cp.date)}</p>
                      <p className="text-[10px] text-white/60 capitalize">{photo.angle.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <GlassCard className="p-8 text-center">
              <Camera className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary">No progress photos yet.</p>
            </GlassCard>
          )}
        </div>
      )}

      {tab === 'trends' && (
        <div className="space-y-6">
          {/* Posture Score Trend */}
          <GlassCard className="p-6">
            <h3 className="font-display text-lg font-bold text-text-primary mb-1">Posture Score Trend</h3>
            <p className="text-xs text-text-secondary mb-6">Last 90 days</p>
            {checkpoints && checkpoints.length > 1 ? (
              <div className="h-40 flex items-end gap-4">
                {[...checkpoints].reverse().map((cp) => (
                  <div key={cp.id} className="flex-1 flex flex-col items-center gap-2">
                    <span className="font-mono text-sm text-text-primary">{cp.score}</span>
                    <div
                      className="w-full rounded-t-sm bg-accent-primary"
                      style={{ height: `${cp.score * 1.2}px`, opacity: 0.7 }}
                    />
                    <span className="text-[10px] text-text-tertiary">
                      {new Date(cp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-tertiary">Need at least 2 checkpoints to show trends.</p>
            )}
          </GlassCard>

          {/* Training Consistency */}
          <GlassCard className="p-6">
            <h3 className="font-display text-lg font-bold text-text-primary mb-1">Training Consistency</h3>
            <p className="text-xs text-text-secondary mb-4">Sessions this week</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-4xl font-bold text-accent-primary">{sessions?.length ?? 0}</span>
              <span className="text-sm text-text-secondary">sessions recorded</span>
            </div>
          </GlassCard>
        </div>
      )}
    </PageContainer>
  );
}
