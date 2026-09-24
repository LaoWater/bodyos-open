import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  success: 'bg-success/15 text-success border-success/20',
  warning: 'bg-warning/15 text-warning border-warning/20',
  error: 'bg-error/15 text-error border-error/20',
  info: 'bg-info/15 text-info border-info/20',
  neutral: 'bg-bg-tertiary text-text-secondary border-border-subtle',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
