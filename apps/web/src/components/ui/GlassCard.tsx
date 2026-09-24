import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, variant = 'default', hover, className, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'rounded-[12px] transition-all duration-200',
        variant === 'default' && 'glass shadow-md',
        variant === 'elevated' && 'glass-elevated',
        variant === 'subtle' && 'bg-bg-tertiary/50 border border-border-subtle',
        hover && 'cursor-pointer hover:-translate-y-0.5 hover:border-border-strong hover:shadow-glow',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
