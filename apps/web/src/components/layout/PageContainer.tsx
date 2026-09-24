import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; path?: string }[];
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PageContainer({ title, subtitle, action, children, className }: PageContainerProps) {
  return (
    <div className={cn('px-4 md:px-8 py-6 md:py-8 max-w-[1440px] mx-auto', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary tracking-[-0.02em]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
