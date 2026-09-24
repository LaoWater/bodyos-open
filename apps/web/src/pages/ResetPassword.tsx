import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const updatePassword = useAuthStore((s) => s.updatePassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setDone(true);
      setTimeout(() => navigate('/app/home'), 2000);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="glass rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <CheckCircle className="w-10 h-10 text-success mx-auto" />
          <p className="text-text-primary font-medium">Password updated!</p>
          <p className="text-sm text-text-secondary">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6">
      <div className="glass rounded-2xl p-8 max-w-sm w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-accent-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-text-primary">Set New Password</h1>
          <p className="text-sm text-text-secondary mt-1">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full py-2.5 rounded-[8px] text-sm font-medium transition-all duration-150',
              'bg-gradient-to-r from-accent-primary to-accent-secondary text-white',
              'shadow-md hover:shadow-glow active:scale-[0.98]',
              'disabled:opacity-50 disabled:pointer-events-none',
              'flex items-center justify-center gap-2'
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </form>

        <button
          onClick={() => navigate('/auth')}
          className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mx-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
