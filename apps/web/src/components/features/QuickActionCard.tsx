import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface QuickActionCardProps {
  icon: ReactNode;
  label: string;
  subtitle: string;
  tint: string;
  onClick: () => void;
}

export function QuickActionCard({ icon, label, subtitle, tint, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center text-center p-5 rounded-[16px] transition-all duration-150',
        'hover:scale-[1.02] active:scale-[0.98] w-full'
      )}
      style={{ background: tint }}
    >
      <div className="mb-3 text-text-primary">{icon}</div>
      <div className="text-sm font-semibold text-text-primary mb-0.5">{label}</div>
      <div className="text-xs text-text-secondary">{subtitle}</div>
    </button>
  );
}
