import { useParams } from 'react-router';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { FormScoreRing } from '@/components/charts/FormScoreRing';
import { BodyBlueprint } from '@/components/charts/BodyBlueprint';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useCheckpoint } from '@/hooks/useCheckpoints';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const severityIcon = {
  high: <AlertCircle className="w-4 h-4 text-error" />,
  medium: <AlertTriangle className="w-4 h-4 text-warning" />,
  low: <Info className="w-4 h-4 text-info" />,
};

const severityBadge = {
  high: 'error' as const,
  medium: 'warning' as const,
  low: 'info' as const,
};

export default function CheckpointDetail() {
  const { id } = useParams();
  const { data: checkpoint, isLoading } = useCheckpoint(id!);

  if (isLoading) {
    return (
      <PageContainer title="Checkpoint">
        <div className="grid lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!checkpoint) {
    return (
      <PageContainer title="Checkpoint">
        <GlassCard className="p-8 text-center">
          <p className="text-text-secondary">Checkpoint not found.</p>
        </GlassCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Body Checkpoint"
      subtitle={formatDate(checkpoint.date)}
    >
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        {/* Left — Blueprint */}
        <GlassCard className="p-6 flex items-center justify-center">
          <BodyBlueprint
            score={checkpoint.score}
            focusAreas={checkpoint.focusAreas}
            size="lg"
          />
        </GlassCard>

        {/* Right — Details */}
        <div className="space-y-4">
          {/* Score */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-6">
              <FormScoreRing score={checkpoint.score} size={100} />
              <div>
                <h3 className="font-display text-lg font-bold text-text-primary">Overall Score</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Based on alignment analysis across 4 angles
                </p>
                <Badge variant={checkpoint.score >= 85 ? 'success' : checkpoint.score >= 60 ? 'warning' : 'error'} className="mt-2">
                  {checkpoint.score >= 85 ? 'Excellent' : checkpoint.score >= 60 ? 'Fair' : 'Needs Attention'}
                </Badge>
              </div>
            </div>
          </GlassCard>

          {/* Focus Areas */}
          {checkpoint.focusAreas.length > 0 && (
            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-bold text-text-primary mb-4">Focus Areas</h3>
              <div className="space-y-4">
                {checkpoint.focusAreas.map((fa) => (
                  <div key={fa.id} className="flex gap-3">
                    <div className="mt-0.5">{severityIcon[fa.severity]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-text-primary">{fa.name}</span>
                        <Badge variant={severityBadge[fa.severity]} className="text-[10px]">{fa.severity}</Badge>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">{fa.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* AI Summary */}
          {checkpoint.aiSummary && (
            <GlassCard className="p-6">
              <h3 className="font-display text-lg font-bold text-text-primary mb-3">Coach Assessment</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{checkpoint.aiSummary}</p>
            </GlassCard>
          )}

          {/* Photos */}
          <GlassCard className="p-6">
            <h3 className="font-display text-lg font-bold text-text-primary mb-4">Checkpoint Photos</h3>
            <div className="grid grid-cols-2 gap-3">
              {checkpoint.photos.map((photo) => (
                <div key={photo.id} className="relative rounded-[8px] overflow-hidden bg-bg-tertiary aspect-[3/4]">
                  <img
                    src={photo.url}
                    alt={photo.angle.replace('_', ' ')}
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <span className="text-[10px] text-white/80 capitalize">
                      {photo.angle.replace('_', ' ')}
                    </span>
                    {photo.score && (
                      <span className="text-[10px] text-white/60 ml-2 font-mono">{photo.score}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageContainer>
  );
}
