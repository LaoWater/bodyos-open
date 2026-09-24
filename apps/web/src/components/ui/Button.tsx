import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-[8px] transition-all duration-150',
        'active:scale-[0.98] hover:scale-[1.02]',
        'disabled:opacity-50 disabled:pointer-events-none',

        variant === 'primary' && 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-md hover:shadow-glow',
        variant === 'secondary' && 'border border-accent-primary text-accent-primary hover:bg-accent-primary/10',
        variant === 'ghost' && 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
        variant === 'danger' && 'bg-error text-white hover:bg-error/90',

        size === 'sm' && 'text-sm px-3 py-1.5',
        size === 'md' && 'text-sm px-4 py-2.5',
        size === 'lg' && 'text-base px-6 py-3',

        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
