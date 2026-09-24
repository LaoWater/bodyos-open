import { useLocation, useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { useAppModeStore } from '@/stores/appModeStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Home,
  Scan,
  Video,
  TrendingUp,
  Brain,
  Dumbbell,
  BookOpen,
  Trophy,
  MessageSquare,
  Settings,
  X,
  Flame,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Home', path: '/app/home', icon: <Home className="w-[18px] h-[18px]" /> },
      { label: 'Sessions', path: '/app/sessions', icon: <Video className="w-[18px] h-[18px]" /> },
      { label: 'Progress', path: '/app/progress', icon: <TrendingUp className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: 'Body',
    items: [
      { label: 'Body Intelligence', path: '/app/body-intelligence', icon: <Scan className="w-[18px] h-[18px]" /> },
      { label: 'Workouts', path: '/app/workouts', icon: <Dumbbell className="w-[18px] h-[18px]" /> },
      { label: 'Exercises', path: '/app/exercises', icon: <BookOpen className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Coach', path: '/app/coach', icon: <Brain className="w-[18px] h-[18px]" /> },
      { label: 'Achievements', path: '/app/achievements', icon: <Trophy className="w-[18px] h-[18px]" /> },
      { label: 'WhatsApp', path: '/app/whatsapp', icon: <MessageSquare className="w-[18px] h-[18px]" /> },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = useAppModeStore((s) => s.mode);
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen w-[260px] bg-bg-secondary z-50 flex flex-col',
          'border-r border-border-subtle transition-transform duration-200',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: 'linear-gradient(180deg, var(--color-bg-secondary) 0%, var(--color-bg-primary) 100%)' }}
      >
        {/* Close button on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-[8px] text-text-tertiary hover:text-text-primary lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="px-5 pt-6 pb-2">
          <img
            src="/media/logo2-square-transparent.png"
            alt="BodyOS"
            className="h-10 w-auto opacity-90 cursor-pointer"
            onClick={() => navigate('/')}
          />
        </div>

        {/* User mini-profile */}
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-sm font-bold text-white">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text-primary truncate">Alex Chen</div>
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-brand-amber" />
              <span className="text-xs text-brand-amber font-mono">12</span>
            </div>
          </div>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-1.5 text-[11px] font-medium text-text-tertiary uppercase tracking-[0.1em]">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-all duration-150',
                        isActive
                          ? 'text-accent-primary bg-accent-primary/8 border-l-2 border-accent-primary'
                          : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary border-l-2 border-transparent'
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-2">
          <button
            onClick={() => {
              navigate('/app/settings');
              setSidebarOpen(false);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-colors',
              location.pathname === '/app/settings'
                ? 'text-accent-primary bg-accent-primary/8'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary'
            )}
          >
            <Settings className="w-[18px] h-[18px]" />
            <span>Settings</span>
          </button>

          {mode === 'real' && (
            <button
              onClick={async () => {
                await useAuthStore.getState().logout();
                useAppModeStore.getState().setMode('demo');
                navigate('/auth');
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm text-text-tertiary hover:text-error hover:bg-error/5 transition-colors"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span>Sign Out</span>
            </button>
          )}

          <button
            onClick={() => {
              navigate('/');
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary transition-colors"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            <span>Back to Home</span>
          </button>

          <div className="px-3 pt-2 flex items-center justify-between">
            <Badge variant={mode === 'demo' ? 'warning' : 'success'}>
              {mode === 'demo' ? 'Demo Mode' : 'Live'}
            </Badge>
            <ThemeToggle size="sm" />
          </div>
        </div>
      </aside>
    </>
  );
}
