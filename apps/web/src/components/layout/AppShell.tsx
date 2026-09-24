import { Outlet, Navigate } from 'react-router';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useAppModeStore } from '@/stores/appModeStore';
import { Menu, Loader2 } from 'lucide-react';

export function AppShell() {
  const { setSidebarOpen } = useUIStore();
  const { isAuthenticated, isLoading } = useAuthStore();
  const mode = useAppModeStore((s) => s.mode);

  // In real mode, require authentication
  if (mode === 'real') {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        </div>
      );
    }
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar />

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-bg-secondary/90 backdrop-blur-sm border-b border-border-subtle flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 rounded-[8px] text-text-secondary hover:text-text-primary"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src="/media/logo-square-transparent.png" alt="BodyOS" className="h-7 ml-3" />
      </div>

      {/* Main content */}
      <main className="lg:ml-[260px] min-h-screen pt-14 lg:pt-0 pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
