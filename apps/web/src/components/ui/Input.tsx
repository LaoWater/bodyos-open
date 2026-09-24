import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2.5 bg-bg-tertiary border border-border-default rounded-[8px]',
          'text-text-primary placeholder:text-text-disabled',
          'focus:border-border-strong focus:ring-1 focus:ring-accent-primary/30',
          'transition-colors duration-150 outline-hidden',
          error && 'border-error focus:ring-error/30',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
