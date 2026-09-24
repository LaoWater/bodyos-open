import { useLocation, useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { Home, Scan, Video, Brain, User } from 'lucide-react';

const tabs = [
  { label: 'Home', path: '/app/home', icon: Home },
  { label: 'Scan', path: '/app/body-intelligence', icon: Scan },
  { label: 'Camera', path: '/app/sessions', icon: Video },
  { label: 'Coach', path: '/app/coach', icon: Brain },
  { label: 'Profile', path: '/app/profile', icon: User },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-bg-secondary/95 backdrop-blur-sm border-t border-border-subtle">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab, i) => {
          const isActive = location.pathname.startsWith(tab.path);
          const isCenter = i === 2;
          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex flex-col items-center gap-1 py-1 px-3 rounded-[12px] transition-colors min-w-[56px]',
                isCenter && 'relative',
                isActive ? 'text-accent-primary' : 'text-text-tertiary'
              )}
            >
              {isCenter ? (
                <div className="w-11 h-11 -mt-5 rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              ) : (
                <Icon className="w-5 h-5" />
              )}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
