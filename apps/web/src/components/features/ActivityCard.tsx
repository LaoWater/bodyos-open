import { Dumbbell, Scan, Flame, Trophy } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { ActivityFeedItem } from '@/types/models';

const iconMap = {
  workout: <Dumbbell className="w-4 h-4" />,
  checkpoint: <Scan className="w-4 h-4" />,
  streak: <Flame className="w-4 h-4" />,
  achievement: <Trophy className="w-4 h-4" />,
};

const colorMap = {
  workout: 'text-accent-primary bg-accent-primary/10',
  checkpoint: 'text-accent-secondary bg-accent-secondary/10',
  streak: 'text-brand-amber bg-brand-amber/10',
  achievement: 'text-brand-amber bg-brand-amber/10',
};

interface ActivityCardProps {
  item: ActivityFeedItem;
}

export function ActivityCard({ item }: ActivityCardProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] hover:bg-bg-tertiary/50 transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorMap[item.type]}`}>
        {iconMap[item.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{item.title}</div>
        <div className="text-xs text-text-secondary truncate">{item.subtitle}</div>
      </div>
      <div className="text-xs text-text-tertiary whitespace-nowrap">
        {formatRelativeTime(item.timestamp)}
      </div>
    </div>
  );
}
