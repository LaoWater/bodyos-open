import { useNavigate } from 'react-router';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useSessions } from '@/hooks/useSessions';
import { formatDate } from '@/lib/utils';
import { Play, Clock } from 'lucide-react';

export default function Sessions() {
  const navigate = useNavigate();
  const { data: sessions, isLoading } = useSessions();

  return (
    <PageContainer title="Sessions" subtitle="Review your recorded workout sessions">
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions?.map((session) => (
            <GlassCard
              key={session.id}
              hover
              className="overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/app/sessions/${session.id}`)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-bg-tertiary overflow-hidden">
                {session.thumbnailUrl ? (
                  <img
                    src={session.thumbnailUrl}
                    alt={session.exercise}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-text-disabled" />
                  </div>
                )}

                {/* Score badge */}
                {session.formScore !== undefined && (
                  <div className="absolute top-3 right-3">
                    <Badge variant={session.formScore >= 85 ? 'success' : session.formScore >= 60 ? 'warning' : 'error'}>
                      <span className="font-mono">{session.formScore}</span>
                    </Badge>
                  </div>
                )}

                {/* Duration */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3" />
                  {session.duration}
                </div>

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-accent-primary/80 flex items-center justify-center shadow-glow">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-text-primary">{session.exercise}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-text-secondary">{formatDate(session.date)}</span>
                  {session.reps && (
                    <span className="text-xs text-text-tertiary">&middot; {session.reps} reps</span>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}

          {(!sessions || sessions.length === 0) && (
            <GlassCard className="col-span-full p-8 text-center">
              <Play className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary">No recorded sessions yet.</p>
              <p className="text-xs text-text-tertiary mt-1">Record your first workout on the mobile app.</p>
            </GlassCard>
          )}
        </div>
      )}
    </PageContainer>
  );
}
