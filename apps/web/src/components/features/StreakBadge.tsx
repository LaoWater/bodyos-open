import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  count: number;
  className?: string;
}

export function StreakBadge({ count, className }: StreakBadgeProps) {
  return (
    <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-amber/10 border border-brand-amber/20', className)}>
      <Flame className="w-4 h-4 text-brand-amber" />
      <span className="font-mono text-sm font-medium text-brand-amber">{count}</span>
    </div>
  );
}
