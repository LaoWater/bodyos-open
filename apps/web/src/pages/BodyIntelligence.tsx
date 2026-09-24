import { useNavigate } from 'react-router';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import { formatDate } from '@/lib/utils';
import { Smartphone, ChevronRight } from 'lucide-react';

export default function BodyIntelligence() {
  const navigate = useNavigate();
  const { data: checkpoints, isLoading } = useCheckpoints();

  return (
    <PageContainer title="Body Intelligence" subtitle="Track your structural alignment and movement patterns">
      {/* Hero CTA */}
      <GlassCard variant="elevated" className="p-6 md:p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-14 h-14 rounded-[16px] bg-accent-secondary/15 flex items-center justify-center">
            <Smartphone className="w-7 h-7 text-accent-secondary" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold text-text-primary mb-1">Body Checkpoint</h2>
            <p className="text-sm text-text-secondary">
              Capture 4 angles on mobile to get your full body analysis. The AI will assess your posture, identify focus areas, and track changes over time.
            </p>
          </div>
          <Button icon={<Smartphone className="w-4 h-4" />}>
            Open Mobile App
          </Button>
        </div>
      </GlassCard>

      {/* Checkpoint Timeline */}
      <h2 className="font-display text-lg font-bold text-text-primary mb-4">Checkpoint Timeline</h2>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-4">
          {checkpoints?.map((cp) => (
            <GlassCard
              key={cp.id}
              hover
              className="p-5"
              onClick={() => navigate(`/app/body-intelligence/${cp.id}`)}
            >
              <div className="flex items-center gap-5">
                {/* Photo thumbnails */}
                <div className="hidden sm:grid grid-cols-2 gap-1 w-20 h-20 flex-shrink-0">
                  {cp.photos.slice(0, 4).map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-bg-tertiary rounded-sm overflow-hidden"
                    >
                      <img
                        src={photo.url}
                        alt={photo.angle}
                        className="w-full h-full object-cover opacity-60"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-text-primary">
                      {formatDate(cp.date)}
                    </span>
                    <Badge variant={cp.status === 'completed' ? 'success' : cp.status === 'processing' ? 'info' : 'error'}>
                      {cp.status}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-2xl font-bold text-text-primary">{cp.score}</span>
                    <span className="text-xs text-text-secondary">/100</span>
                  </div>
                  {cp.focusAreas.length > 0 && (
                    <p className="text-xs text-warning">
                      {cp.focusAreas.length} focus area{cp.focusAreas.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0" />
              </div>
            </GlassCard>
          ))}

          {(!checkpoints || checkpoints.length === 0) && (
            <GlassCard className="p-8 text-center">
              <p className="text-text-secondary mb-4">No checkpoints yet. Start your first body assessment on mobile.</p>
              <Button variant="secondary" icon={<Smartphone className="w-4 h-4" />}>
                Open Mobile App
              </Button>
            </GlassCard>
          )}
        </div>
      )}
    </PageContainer>
  );
}
