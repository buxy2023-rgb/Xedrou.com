import React, { useEffect, useState } from "react";
import { ArrowRight, Loader2, Phone } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function PhoneRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.auth.me().then((user) => {
      if (user?.phone_number) navigate(next, { replace: true });
      else setLoading(false);
    }).catch(() => { setError("Please complete Google sign-in before adding your phone number."); setLoading(false); });
  }, [navigate, next]);

  async function submit() {
    const value = phoneNumber.trim();
    if (value.length < 7) return setError("Enter a valid phone number.");
    setSaving(true); setError("");
    try { await base44.auth.savePhoneNumber(value); navigate(next, { replace: true }); }
    catch (err) { setError(err?.message || "Unable to save your phone number."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 grid place-items-center text-white"><Loader2 className="animate-spin text-cyan-300" size={30}/></div>;
  return <div className="min-h-screen bg-slate-950 px-5 py-10 text-white md:py-16"><div className="mx-auto flex min-h-[75vh] max-w-md items-center"><div className="w-full rounded-3xl border border-white/10 bg-white/5 p-7 md:p-9">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Phone size={22}/></div>
    <div className="mt-7 text-xs uppercase tracking-[.25em] text-cyan-300">Almost done</div><h1 className="mt-2 text-3xl font-black">Add your phone number</h1><p className="mt-3 text-sm leading-6 text-slate-400">We use your phone number to secure your Xedruo account and support account recovery.</p>
    <label className="mt-7 block text-sm font-medium text-slate-300">Phone number</label><input value={phoneNumber} onChange={(event) => { setPhoneNumber(event.target.value); setError(""); }} placeholder="+234 800 000 0000" inputMode="tel" className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300/60"/>
    {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
    <button onClick={submit} disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={18}/> : null}{saving ? "Saving…" : "Continue"}<ArrowRight size={18}/></button>
    <p className="mt-4 text-center text-[11px] text-slate-600">You can update this number later from account settings.</p>
  </div></div></div>;
}
