import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/GlassCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useAchievements } from '@/hooks/useAchievements';
import { formatDate } from '@/lib/utils';
import {
  Footprints, Scan, Flame, Target, Shield,
  BookOpen, TrendingUp, Crown, Star, Microscope,
} from 'lucide-react';
import type { ReactNode } from 'react';

const iconMap: Record<string, ReactNode> = {
  footprints: <Footprints className="w-6 h-6" />,
  scan: <Scan className="w-6 h-6" />,
  flame: <Flame className="w-6 h-6" />,
  target: <Target className="w-6 h-6" />,
  shield: <Shield className="w-6 h-6" />,
  'book-open': <BookOpen className="w-6 h-6" />,
  'trending-up': <TrendingUp className="w-6 h-6" />,
  crown: <Crown className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
  microscope: <Microscope className="w-6 h-6" />,
};

export default function Achievements() {
  const { data: achievements, isLoading } = useAchievements();

  const unlocked = achievements?.filter((a) => a.unlocked) ?? [];
  const locked = achievements?.filter((a) => !a.unlocked) ?? [];

  return (
    <PageContainer title="Achievements" subtitle={`${unlocked.length} of ${achievements?.length ?? 0} unlocked`}>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Unlocked first */}
          {unlocked.map((ach) => (
            <GlassCard key={ach.id} className="p-5 text-center" hover>
              <div className="w-14 h-14 rounded-full bg-brand-amber/15 flex items-center justify-center mx-auto mb-3 text-brand-amber shadow-[0_0_15px_rgba(212,165,116,0.2)]">
                {iconMap[ach.icon] || <Star className="w-6 h-6" />}
              </div>
              <h3 className="text-sm font-semibold text-text-primary mb-1">{ach.title}</h3>
              <p className="text-xs text-text-secondary mb-2">{ach.description}</p>
              {ach.unlockedDate && (
                <p className="text-[10px] text-brand-amber font-mono">{formatDate(ach.unlockedDate)}</p>
              )}
            </GlassCard>
          ))}

          {/* Locked */}
          {locked.map((ach) => (
            <GlassCard key={ach.id} className="p-5 text-center opacity-50">
              <div className="w-14 h-14 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3 text-text-disabled">
                {iconMap[ach.icon] || <Star className="w-6 h-6" />}
              </div>
              <h3 className="text-sm font-semibold text-text-disabled mb-1">{ach.title}</h3>
              <p className="text-xs text-text-disabled">{ach.description}</p>
            </GlassCard>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
