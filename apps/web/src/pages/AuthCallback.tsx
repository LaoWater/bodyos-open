import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { supabase } from '@/lib/supabase';
import { useAppModeStore } from '@/stores/appModeStore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your account...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setMode = useAppModeStore((s) => s.setMode);

  useEffect(() => {
    const handleCallback = async () => {
      const type = searchParams.get('type');

      // Supabase handles the token exchange from the URL hash automatically
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setStatus('error');
        setMessage(error.message);
        return;
      }

      if (type === 'recovery') {
        // Password reset flow — redirect to reset form
        setStatus('success');
        setMessage('Redirecting to password reset...');
        setTimeout(() => navigate('/auth/reset-password'), 1500);
        return;
      }

      if (session) {
        // Email confirmed or OAuth callback — go to app
        setStatus('success');
        setMessage('Email confirmed! Redirecting...');
        setMode('real');
        setTimeout(() => navigate('/app/home'), 1500);
      } else {
        setStatus('error');
        setMessage('Could not verify your account. The link may have expired.');
      }
    };

    handleCallback();
  }, [navigate, searchParams, setMode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="glass rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
        {status === 'loading' && (
          <Loader2 className="w-10 h-10 text-accent-primary animate-spin mx-auto" />
        )}
        {status === 'success' && (
          <CheckCircle className="w-10 h-10 text-success mx-auto" />
        )}
        {status === 'error' && (
          <XCircle className="w-10 h-10 text-error mx-auto" />
        )}
        <p className="text-text-primary font-medium">{message}</p>
        {status === 'error' && (
          <button
            onClick={() => navigate('/auth')}
            className="text-sm text-accent-primary hover:underline"
          >
            Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
}
