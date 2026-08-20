import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, ShieldCheck, Building2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { XEDRUO_COMPANIES } from "./Home";

export default function CompanyGateway() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState("login");
  const [opening, setOpening] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationPending, setVerificationPending] = useState(false);
  const [error, setError] = useState("");
  const company = useMemo(() => XEDRUO_COMPANIES.find((item) => item[0] === slug), [slug]);

  const openCompany = async (authenticatedUser = user) => {
    if (!company || !authenticatedUser) return;
    setOpening(true);
    if (authenticatedUser.xedruo_id) {
      navigate(`/customer-dashboard?company=${encodeURIComponent(company[0])}`, { replace: true });
      return;
    }
    navigate(`/phone-registration?next=${encodeURIComponent(`/customer-dashboard?company=${company[0]}`)}`, { replace: true });
  };

  if (!company) return <div className="min-h-screen bg-slate-950 text-white grid place-items-center p-6"><div className="text-center"><h1 className="text-2xl font-bold">Company not found</h1><button onClick={() => navigate("/")} className="mt-4 text-cyan-300">Back to Xedruo</button></div></div>;

  const [, name, description] = company;

  async function continueWithGoogle() {
    setOpening(true); setError("");
    try {
      await base44.auth.loginWithProvider("google", `/company/${company[0]}`);
    } catch (err) {
      setOpening(false); setError(err?.message || "Unable to start Google sign-in.");
    }
  }

  async function submitEmail(event) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Enter your email and password.");
    setOpening(true);
    try {
      if (mode === "signup") {
        const result = await base44.auth.register({ email: email.trim(), password });
        if (result?.requiresVerification) {
          setVerificationPending(true);
          setOpening(false);
          return;
        }
      } else {
        await base44.auth.loginViaEmailPassword(email.trim(), password);
      }
      const currentUser = await base44.auth.me();
      await openCompany(currentUser);
    } catch (err) {
      setOpening(false);
      setError(err?.message || (mode === "signup" ? "Unable to create your account." : "Invalid email or password."));
    }
  }

  async function verifySignup() {
    setError("");
    if (!/^\d{6}$/.test(otp.trim())) return setError("Enter the 6-digit verification code sent to your email.");
    setOpening(true);
    try {
      await base44.auth.verifyOtp({ email: email.trim(), otpCode: otp.trim() });
      const currentUser = await base44.auth.me();
      await openCompany(currentUser);
    } catch (err) {
      setOpening(false);
      setError(err?.message || "The verification code is invalid or expired.");
    }
  }

  if (isLoadingAuth || opening) return <div className="min-h-screen bg-slate-950 text-white grid place-items-center p-6"><div className="text-center"><Loader2 className="mx-auto animate-spin text-cyan-300" size={30}/><p className="mt-4 text-sm text-slate-400">{isAuthenticated ? `Opening ${name} dashboard…` : "Preparing secure access…"}</p></div></div>;

  if (!started) return <div className="min-h-screen bg-slate-950 px-5 py-10 text-white md:py-16"><div className="mx-auto flex min-h-[75vh] max-w-3xl items-center"><div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl md:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Building2 size={30}/></div><div className="mt-7 text-xs uppercase tracking-[.3em] text-cyan-300">Xedruo Company</div><h1 className="mt-3 text-4xl font-black md:text-5xl">{name}</h1><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400">{description}. Explore the company website and start when you are ready.</p><button onClick={() => setStarted(true)} className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-7 py-4 font-bold text-slate-950 hover:bg-cyan-200">Get Started <ArrowRight size={18}/></button><button onClick={() => navigate("/")} className="mt-5 block w-full text-sm text-slate-500 hover:text-white">Back to Xedruo Group Holdings</button></div></div></div>;

  return <div className="min-h-screen bg-slate-950 px-5 py-10 text-white md:py-16"><div className="mx-auto flex min-h-[75vh] max-w-md items-center"><div className="w-full rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl md:p-9">
    <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><ShieldCheck size={24}/></div><span className="text-xs uppercase tracking-[.25em] text-slate-500">Secure access</span></div>
    <div className="mt-8 text-xs uppercase tracking-[.25em] text-cyan-300">Xedruo company</div><h1 className="mt-2 text-3xl font-black">{name}</h1><p className="mt-3 text-sm leading-6 text-slate-400">Continue to your {name} customer dashboard securely.</p>
    <div className="mt-7 grid grid-cols-2 rounded-2xl bg-slate-900 p-1 text-sm"><button onClick={() => { setMode("login"); setError(""); setVerificationPending(false); }} className={`rounded-xl px-3 py-2.5 font-semibold ${mode === "login" ? "bg-white text-slate-900" : "text-slate-400"}`}>Log in</button><button onClick={() => { setMode("signup"); setError(""); setVerificationPending(false); }} className={`rounded-xl px-3 py-2.5 font-semibold ${mode === "signup" ? "bg-white text-slate-900" : "text-slate-400"}`}>Sign up</button></div>
    {verificationPending ? <div className="mt-6"><h2 className="text-xl font-bold">Verify your email</h2><p className="mt-2 text-sm text-slate-400">We sent a 6-digit code to <span className="text-slate-200">{email}</span>.</p><input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="000000" className="mt-5 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-center text-xl tracking-[.4em] text-white outline-none focus:border-cyan-300/60"/><button onClick={verifySignup} className="mt-4 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950">Verify & continue</button><button onClick={() => setVerificationPending(false)} className="mt-3 w-full text-sm text-slate-400">Back to sign up</button></div> : <>
      <button onClick={continueWithGoogle} className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-900 transition hover:bg-slate-100"><span className="grid h-6 w-6 place-items-center rounded-full border border-slate-200 text-xs font-black">G</span>Continue with Google</button>
      <div className="my-5 flex items-center gap-3 text-xs text-slate-600"><div className="h-px flex-1 bg-white/10"/><span>or use email</span><div className="h-px flex-1 bg-white/10"/></div>
      <form onSubmit={submitEmail}><label className="text-sm text-slate-300">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300/60"/><label className="mt-4 block text-sm text-slate-300">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300/60"/><button type="submit" className="mt-5 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950">{mode === "login" ? "Log in securely" : "Create account"}</button></form>
    </>}
    {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
    <button onClick={() => setStarted(false)} className="mt-5 flex w-full items-center justify-center gap-2 text-sm text-slate-400 hover:text-white">Back to company landing page <ArrowRight size={15}/></button>
  </div></div></div>;
}
