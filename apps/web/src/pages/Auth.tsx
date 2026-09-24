import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAppModeStore } from '@/stores/appModeStore';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { Loader2, ArrowLeft, AlertCircle, Mail } from 'lucide-react';

// ─── OAuth SVG Icons ──────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

// ─── Aurora Background Component ──────────────────────────────
function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base */}
      <div className="absolute inset-0 bg-bg-primary" />

      {/* Aurora blobs — higher opacity in light mode via class overrides */}
      <div
        className="auth-aurora-blob absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #5B7CFA 0%, transparent 70%)',
          top: '-10%',
          left: '10%',
          animation: 'auroraMove1 20s ease-in-out infinite',
        }}
      />
      <div
        className="auth-aurora-blob absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #4ECDC4 0%, transparent 70%)',
          bottom: '-5%',
          right: '-5%',
          animation: 'auroraMove2 25s ease-in-out infinite',
        }}
      />
      <div
        className="auth-aurora-blob absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #D4A574 0%, transparent 70%)',
          top: '40%',
          left: '-10%',
          animation: 'auroraMove3 22s ease-in-out infinite',
        }}
      />
      <div
        className="auth-aurora-blob absolute w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #5B7CFA 0%, transparent 70%)',
          bottom: '10%',
          left: '40%',
          animation: 'auroraMove4 28s ease-in-out infinite',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(91,124,250,0.8) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top-center radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
        style={{
          background: 'radial-gradient(ellipse at center top, #5B7CFA 0%, transparent 70%)',
          animation: 'glowPulse 6s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────────
export default function Auth() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);
  const navigate = useNavigate();
  const setMode = useAppModeStore((s) => s.setMode);
  const { login, signup, loginWithOAuth, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'signin') {
        const result = await login(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          setMode('real');
          navigate('/app/home');
        }
      } else {
        const result = await signup(email, password, name);
        if (result.error) {
          setError(result.error);
        } else if (result.needsConfirmation) {
          setConfirmationSent(true);
        } else {
          // Auto-confirmed (e.g. confirmations disabled in Supabase)
          setMode('real');
          navigate('/app/home');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    await loginWithOAuth(provider);
  };

  const handleDemo = () => {
    setMode('demo');
    navigate('/app/home');
  };

  const switchTab = (t: 'signin' | 'signup') => {
    setTab(t);
    setError('');
    setConfirmationSent(false);
    clearError();
  };

  // ─── Email Confirmation Sent View ──────────────────────
  if (confirmationSent) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary px-6">
        <AuroraBackground />
        <div className="relative z-10 glass rounded-2xl p-8 max-w-sm w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-accent-secondary/10 flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7 text-accent-secondary" />
          </div>
          <h2 className="text-xl font-display font-bold text-text-primary">Check your email</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="text-text-primary font-medium">{email}</span>.
            Click the link to activate your account.
          </p>
          <div className="pt-2 space-y-3">
            <button
              onClick={() => { setConfirmationSent(false); switchTab('signin'); }}
              className="text-sm text-accent-primary hover:underline"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen grid lg:grid-cols-2">
      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL — Form
          ═══════════════════════════════════════════════════════ */}
      <div className="relative flex items-center justify-center px-6 sm:px-12 lg:px-16 overflow-hidden">
        <AuroraBackground />

        {/* Theme toggle — top right of form area */}
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle size="sm" />
        </div>

        {/* Form container */}
        <div className="relative z-10 w-full max-w-[380px]">
          {/* Heading */}
          <h1 className="text-[28px] font-display font-bold text-text-primary tracking-tight mb-1.5">
            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-text-secondary mb-8">
            {tab === 'signin'
              ? 'Sign in to access your body intelligence'
              : 'Start your body intelligence journey'}
          </p>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleOAuth('google')}
              className="auth-oauth-btn flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-[8px] text-sm font-medium text-text-primary active:scale-[0.98] transition-all duration-150"
            >
              <GoogleIcon className="w-[18px] h-[18px]" />
              Google
            </button>
            <button
              onClick={() => handleOAuth('apple')}
              className="auth-oauth-btn flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-[8px] text-sm font-medium text-text-primary active:scale-[0.98] transition-all duration-150"
            >
              <AppleIcon className="w-[18px] h-[18px]" />
              Apple
            </button>
          </div>

          {/* Divider — faded lines, no background on text */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />
            <span className="text-xs text-text-tertiary">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />
          </div>

          {/* Tab toggle */}
          <div className="auth-tab-toggle flex rounded-[8px] p-1 mb-5">
            {(['signin', 'signup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={cn(
                  'flex-1 py-2 text-sm font-medium rounded-[6px] transition-all duration-200',
                  tab === t
                    ? 'bg-accent-primary text-white shadow-sm shadow-accent-primary/25'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Error alert */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-error/10 border border-error/20 mb-4">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <Input
                label="Full Name"
                placeholder="Alex Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {tab === 'signin' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/auth/forgot-password')}
                  className="text-xs text-text-tertiary hover:text-accent-primary transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-2.5 mt-2 rounded-[8px] text-sm font-medium transition-all duration-150',
                'bg-gradient-to-r from-accent-primary to-accent-secondary text-white',
                'shadow-md hover:shadow-glow active:scale-[0.98]',
                'disabled:opacity-50 disabled:pointer-events-none',
                'flex items-center justify-center gap-2'
              )}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Demo + Home links */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors duration-150"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </button>
            <span className="text-text-disabled">|</span>
            <button
              onClick={handleDemo}
              className="text-sm text-accent-primary/80 hover:text-accent-primary transition-colors duration-150"
            >
              Try Demo Mode
            </button>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-text-disabled text-center mt-8 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-text-tertiary hover:text-accent-primary transition-colors">Terms</a>
            {' '}and{' '}
            <a href="/privacy" className="text-text-tertiary hover:text-accent-primary transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL — Blueprint Image
          ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:block relative overflow-hidden">
        {/* Inset container with rounded corners */}
        <div className="absolute inset-3 rounded-2xl overflow-hidden">
          {/* Full-bleed image */}
          <img
            src="/media/bodyos-blueprints-vertical-shaped.png"
            alt="BodyOS Blueprint"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark scrim over entire image — ensures text readability in both themes */}
          <div className="absolute inset-0 bg-[#0a0b0e]/30" />

          {/* Top brand color wash */}
          <div className="absolute inset-0 bg-gradient-to-b from-accent-primary/[0.08] via-transparent to-transparent" />

          {/* Left edge fade */}
          <div className="absolute inset-y-0 left-0 w-24 auth-image-edge-fade" />

          {/* Bottom fade for badge readability */}
          <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#0a0b0e]/70 to-transparent" />

          {/* Floating glass badge */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="auth-glass-badge rounded-xl px-5 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse" />
                <p className="text-sm font-medium text-white/95">Body Intelligence Platform</p>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Real-time pose analysis, body checkpoints, and AI coaching — all on-device.
              </p>
            </div>
          </div>

          {/* Top-right version pill */}
          <div className="absolute top-6 right-6">
            <div className="auth-version-pill px-3 py-1.5 rounded-full text-[11px] font-medium text-white/70">
              BodyOS v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
