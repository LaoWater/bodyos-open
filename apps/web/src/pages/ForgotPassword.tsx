import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6">
        <div className="glass rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <CheckCircle className="w-10 h-10 text-success mx-auto" />
          <h2 className="text-lg font-display font-bold text-text-primary">Check your email</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            We sent a password reset link to <span className="text-text-primary font-medium">{email}</span>.
            Click the link in the email to set a new password.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="text-sm text-accent-primary hover:underline mt-4"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-6">
      <div className="glass rounded-2xl p-8 max-w-sm w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-accent-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-text-primary">Forgot Password?</h1>
          <p className="text-sm text-text-secondary mt-1">Enter your email and we'll send a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            Send Reset Link
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
