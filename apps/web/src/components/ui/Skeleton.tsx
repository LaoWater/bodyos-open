import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-bg-tertiary shimmer',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-[12px]',
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-[12px] p-6 space-y-4">
      <Skeleton className="h-5 w-1/3" variant="text" />
      <Skeleton className="h-4 w-2/3" variant="text" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="glass rounded-[12px] p-4 space-y-3">
      <Skeleton className="h-4 w-20" variant="text" />
      <Skeleton className="h-8 w-16" variant="text" />
    </div>
  );
}
