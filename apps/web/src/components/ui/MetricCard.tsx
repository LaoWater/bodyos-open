import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down'; label: string };
  className?: string;
}

export function MetricCard({ icon, label, value, trend, className }: MetricCardProps) {
  return (
    <div className={cn('glass rounded-[12px] p-4', className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-accent-primary">{icon}</span>
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <div className="font-mono text-2xl font-bold text-text-primary">{value}</div>
      {trend && (
        <div className={cn('flex items-center gap-1 mt-1 text-xs', trend.direction === 'up' ? 'text-success' : 'text-error')}>
          {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend.label}
        </div>
      )}
    </div>
  );
}
