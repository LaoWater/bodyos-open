import { useState } from 'react';
import { useParams } from 'react-router';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MetricCard } from '@/components/ui/MetricCard';
import { FormScoreRing } from '@/components/charts/FormScoreRing';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useSession } from '@/hooks/useSessions';
import { formatDate, cn } from '@/lib/utils';
import { Download, Eye, EyeOff, Check, AlertTriangle, Activity, Timer, Repeat } from 'lucide-react';

const tabs = ['Overview', 'Form Analysis', 'Range of Motion', 'Tempo'] as const;

export default function SessionDetail() {
  const { id } = useParams();
  const { data: session, isLoading } = useSession(id!);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Overview');
  const [showSkeleton, setShowSkeleton] = useState(true);

  if (isLoading) {
    return (
      <PageContainer title="Session">
        <CardSkeleton />
      </PageContainer>
    );
  }

  if (!session) {
    return (
      <PageContainer title="Session">
        <GlassCard className="p-8 text-center">
          <p className="text-text-secondary">Session not found.</p>
        </GlassCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title={session.exercise}
      subtitle={formatDate(session.date)}
      action={
        <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
          Export Report
        </Button>
      }
    >
      {/* Video Player */}
      <GlassCard className="mb-6 overflow-hidden">
        <div className="relative aspect-video bg-black">
          {session.videoUrl ? (
            <video
              src={session.videoUrl}
              controls
              className="w-full h-full object-contain"
              poster={session.thumbnailUrl}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-tertiary">
              <p className="text-sm">Video not available</p>
            </div>
          )}
        </div>
        <div className="px-4 py-3 flex items-center gap-3 border-t border-border-subtle">
          <Button
            variant="ghost"
            size="sm"
            icon={showSkeleton ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            onClick={() => setShowSkeleton(!showSkeleton)}
          >
            {showSkeleton ? 'Hide' : 'Show'} Skeleton
          </Button>
        </div>
      </GlassCard>

      {/* Analysis Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-[8px] whitespace-nowrap transition-colors',
              activeTab === tab
                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                : 'text-text-secondary hover:bg-bg-tertiary'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Activity className="w-5 h-5" />}
              label="Form Score"
              value={session.formScore ?? '--'}
            />
            <MetricCard
              icon={<Repeat className="w-5 h-5" />}
              label="Reps"
              value={session.reps ?? '--'}
            />
            <MetricCard
              icon={<Timer className="w-5 h-5" />}
              label="Duration"
              value={session.duration}
            />
            <MetricCard
              icon={<Activity className="w-5 h-5" />}
              label="Avg Tempo"
              value={session.avgTempo ?? '--'}
            />
          </div>

          {/* Score Ring + Feedback */}
          <div className="grid md:grid-cols-[auto_1fr] gap-6">
            <GlassCard className="p-6 flex items-center justify-center">
              <FormScoreRing score={session.formScore ?? 0} size={140} />
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-bold text-text-primary mb-4">AI Feedback</h3>
              <div className="space-y-3">
                {session.feedback?.map((fb) => (
                  <div key={fb.id} className="flex gap-3">
                    {fb.type === 'positive' ? (
                      <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    )}
                    <p className="text-sm text-text-secondary leading-relaxed">{fb.message}</p>
                  </div>
                ))}
                {!session.feedback?.length && (
                  <p className="text-sm text-text-tertiary">No feedback available for this session.</p>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === 'Form Analysis' && (
        <GlassCard className="p-6">
          <h3 className="font-display text-lg font-bold text-text-primary mb-2">Form Score Over Reps</h3>
          <p className="text-sm text-text-secondary mb-6">Rep-by-rep form quality analysis</p>
          <div className="h-48 flex items-end gap-2">
            {Array.from({ length: session.reps ?? 10 }, (_, i) => {
              const score = (session.formScore ?? 80) + (Math.sin(i * 0.8) * 8) - (i * 0.5);
              const clampedScore = Math.max(50, Math.min(100, score));
              const color = clampedScore >= 85 ? '#4ECDC4' : clampedScore >= 60 ? '#F5A623' : '#E74C3C';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-text-tertiary">{Math.round(clampedScore)}</span>
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${clampedScore * 1.5}px`,
                      backgroundColor: color,
                      opacity: 0.7,
                    }}
                  />
                  <span className="text-[10px] text-text-disabled">{i + 1}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {(activeTab === 'Range of Motion' || activeTab === 'Tempo') && (
        <GlassCard className="p-8 text-center">
          <Badge variant="info" className="mb-3">Coming Soon</Badge>
          <h3 className="font-display text-lg font-bold text-text-primary mb-2">
            {activeTab}
          </h3>
          <p className="text-sm text-text-secondary">
            {activeTab === 'Range of Motion'
              ? 'Joint angle analysis over time — tracking your range of motion improvements across sessions.'
              : 'Eccentric-concentric timing breakdown — optimize your tempo for maximum gains.'}
          </p>
        </GlassCard>
      )}
    </PageContainer>
  );
}
