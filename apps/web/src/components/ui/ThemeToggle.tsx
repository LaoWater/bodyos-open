import { useUIStore } from '@/stores/uiStore';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className, size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useUIStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative rounded-full transition-colors',
        'bg-bg-tertiary hover:bg-bg-overlay border border-border-subtle',
        'flex items-center justify-center',
        size === 'sm' ? 'w-8 h-8' : 'w-9 h-9',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className={cn(
              'text-text-secondary',
              size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
            )} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className={cn(
              'text-brand-amber',
              size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
