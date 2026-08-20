import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

function safeDecode(value) {
  try { return decodeURIComponent(value); } catch { return '/dashboard'; }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const access_token = hashParams.get('access_token') || searchParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const expires_at = hashParams.get('expires_at') || searchParams.get('expires_at');
      const oauthError = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error');

      if (oauthError) {
        setError(oauthError);
        return;
      }

      if (!access_token || !refresh_token) {
        setError('Google sign-in did not return a session. Please try again.');
        return;
      }

      base44.auth._saveSession({
        access_token,
        refresh_token,
        expires_at: expires_at ? Number(expires_at) : undefined,
      });

      const next = safeDecode(searchParams.get('next') || '/dashboard');
      const needsOnboarding = next.startsWith('/company/') || next.startsWith('/customer-dashboard');
      const destination = needsOnboarding
        ? `/phone-registration?next=${encodeURIComponent(next)}`
        : `/registration/country?next=${encodeURIComponent(next)}`;

      window.history.replaceState({}, document.title, '/auth/callback');
      navigate(destination, { replace: true });
    };

    const timer = window.setTimeout(finish, 50);
    return () => { cancelled = true; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center text-white"><p className="max-w-md text-sm text-red-200">{error}</p><button onClick={() => navigate('/', { replace: true })} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">Back to Xedruo</button></div>;
  return <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-white"><div className="w-8 h-8 border-4 border-white/10 border-t-cyan-300 rounded-full animate-spin"></div><p className="text-sm text-slate-400">Finishing secure Google sign-in…</p></div>;
}
