import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Skeleton';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

// Lazy-loaded pages for code splitting
const Landing = lazy(() => import('@/pages/Landing'));
const Auth = lazy(() => import('@/pages/Auth'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Home = lazy(() => import('@/pages/Home'));
const BodyIntelligence = lazy(() => import('@/pages/BodyIntelligence'));
const CheckpointDetail = lazy(() => import('@/pages/CheckpointDetail'));
const Sessions = lazy(() => import('@/pages/Sessions'));
const SessionDetail = lazy(() => import('@/pages/SessionDetail'));
const Coach = lazy(() => import('@/pages/Coach'));
const Workouts = lazy(() => import('@/pages/Workouts'));
const WorkoutSession = lazy(() => import('@/pages/WorkoutSession'));
const Exercises = lazy(() => import('@/pages/Exercises'));
const Progress = lazy(() => import('@/pages/Progress'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const Achievements = lazy(() => import('@/pages/Achievements'));
const WhatsApp = lazy(() => import('@/pages/WhatsApp'));

// New pages
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Contact = lazy(() => import('@/pages/Contact'));
const Changelog = lazy(() => import('@/pages/Changelog'));
const About = lazy(() => import('@/pages/About'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="px-8 py-10 max-w-[1440px] mx-auto space-y-6">
      <Skeleton className="h-8 w-48" variant="text" />
      <Skeleton className="h-4 w-72" variant="text" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function ThemedToaster() {
  const theme = useUIStore((s) => s.theme);
  return <Toaster theme={theme} position="top-right" />;
}

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/about" element={<About />} />

            {/* App routes */}
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Navigate to="home" replace />} />
              <Route path="home" element={<Home />} />
              <Route path="body-intelligence" element={<BodyIntelligence />} />
              <Route path="body-intelligence/:id" element={<CheckpointDetail />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="sessions/:id" element={<SessionDetail />} />
              <Route path="coach" element={<Coach />} />
              <Route path="workouts" element={<Workouts />} />
              <Route path="workout-session/:dayId" element={<WorkoutSession />} />
              <Route path="exercises" element={<Exercises />} />
              <Route path="exercises/:exerciseId" element={<Exercises />} />
              <Route path="progress" element={<Progress />} />
              <Route path="progress/compare" element={<Progress />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="whatsapp" element={<WhatsApp />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <ThemedToaster />
    </QueryClientProvider>
  );
}

export default App;
