import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');
    const expires_at = hashParams.get('expires_at');
    if (!access_token || !refresh_token) { setError('Sign-in was cancelled or the link expired. Please try again.'); return; }

    base44.auth._saveSession({ access_token, refresh_token, expires_at: expires_at ? Number(expires_at) : undefined });
    const next = searchParams.get('next') || '/dashboard';
    const decodedNext = decodeURIComponent(next);
    const needsPhone = decodedNext.startsWith('/company/') || decodedNext.startsWith('/customer-dashboard');
    navigate(needsPhone ? `/phone-registration?next=${encodeURIComponent(decodedNext)}` : `/registration/country?next=${encodeURIComponent(decodedNext)}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 text-center px-4"><p className="text-slate-600">{error}</p><button onClick={() => navigate('/')} className="text-sm underline">Back to Xedruo</button></div>;
  return <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;
}
