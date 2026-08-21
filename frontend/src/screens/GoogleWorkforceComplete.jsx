import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";

export default function GoogleWorkforceComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = searchParams.get("workforce_token");
      if (!token) { setError("Google workforce sign-in did not return a session."); return; }
      try {
        const response = await fetch("/api/workforce/me", { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Workforce session could not be verified.");
        if (cancelled) return;
        localStorage.setItem("xedruo_workforce_token", token);
        localStorage.setItem("xedruo_workforce_account", JSON.stringify(data.account));
        if (data.account.company_slug) localStorage.setItem("xedruo_selected_company", data.account.company_slug);
        if (data.account.role === "developer") navigate("/developer-workstation", { replace: true });
        else if (data.account.role === "chief_of_staff") navigate("/chief-of-staff", { replace: true });
        else if (data.account.role === "governor") navigate("/governor", { replace: true });
        else navigate("/worker-access", { replace: true });
      } catch (e) { if (!cancelled) setError(e.message); }
    })();
    return () => { cancelled = true; };
  }, [navigate, searchParams]);

  if (error) return <div className="min-h-screen bg-slate-950 px-5 text-white grid place-items-center"><div className="max-w-md rounded-3xl border border-red-300/20 bg-white/5 p-7 text-center"><ShieldCheck className="mx-auto text-red-300" size={30}/><h1 className="mt-4 text-xl font-bold">Workforce access denied</h1><p className="mt-3 text-sm leading-6 text-red-100/80">{error}</p><button onClick={() => navigate("/worker-access", { replace: true })} className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900">Back to workforce access</button></div></div>;
  return <div className="min-h-screen bg-slate-950 text-white grid place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-cyan-300" size={32}/><p className="mt-4 text-sm text-slate-400">Verifying your Google workforce identity…</p></div></div>;
}
