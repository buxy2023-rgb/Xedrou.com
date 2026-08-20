import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { XEDRUO_COMPANIES } from "./Home";

export default function CompanyGateway() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [opening, setOpening] = useState(false);
  const company = useMemo(() => XEDRUO_COMPANIES.find((item) => item[0] === slug), [slug]);

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && company) {
      setOpening(true);
      const timer = window.setTimeout(() => navigate(`/customer-dashboard?company=${encodeURIComponent(company[0])}`, { replace: true }), 350);
      return () => window.clearTimeout(timer);
    }
  }, [company, isAuthenticated, isLoadingAuth, navigate]);

  if (!company) return <div className="min-h-screen bg-slate-950 text-white grid place-items-center p-6"><div className="text-center"><h1 className="text-2xl font-bold">Company not found</h1><button onClick={() => navigate("/")} className="mt-4 text-cyan-300">Back to Xedruo</button></div></div>;

  const [, name, description] = company;

  async function continueWithGoogle() {
    setOpening(true);
    try { await base44.auth.loginWithProvider("google", `/company/${company[0]}`); }
    catch { setOpening(false); }
  }

  if (isLoadingAuth || opening) return <div className="min-h-screen bg-slate-950 text-white grid place-items-center p-6"><div className="text-center"><Loader2 className="mx-auto animate-spin text-cyan-300" size={30}/><p className="mt-4 text-sm text-slate-400">{isAuthenticated ? `Opening ${name} dashboard…` : "Preparing secure sign-in…"}</p></div></div>;
  if (isAuthenticated && user) return null;

  return <div className="min-h-screen bg-slate-950 px-5 py-10 text-white md:py-16"><div className="mx-auto flex min-h-[75vh] max-w-md items-center"><div className="w-full rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl md:p-9">
    <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><ShieldCheck size={24}/></div><span className="text-xs uppercase tracking-[.25em] text-slate-500">Secure access</span></div>
    <div className="mt-8 text-xs uppercase tracking-[.25em] text-cyan-300">Xedruo company</div><h1 className="mt-2 text-3xl font-black">{name}</h1><p className="mt-3 text-sm leading-6 text-slate-400">{description}. Sign in to open your customer dashboard for this company.</p>
    <button onClick={continueWithGoogle} className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-900 transition hover:bg-slate-100"><span className="grid h-6 w-6 place-items-center rounded-full border border-slate-200 text-xs font-black">G</span>Continue with Google</button>
    <div className="mt-5 flex items-center gap-3 text-xs text-slate-600"><div className="h-px flex-1 bg-white/10"/><span>secure Xedruo account</span><div className="h-px flex-1 bg-white/10"/></div>
    <button onClick={() => navigate("/")} className="mt-5 flex w-full items-center justify-center gap-2 text-sm text-slate-400 hover:text-white">Back to all companies <ArrowRight size={15}/></button>
  </div></div></div>;
}
