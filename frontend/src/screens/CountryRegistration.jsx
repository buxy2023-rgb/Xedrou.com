import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Globe2, MapPin, Clock3, Coins, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { completeXedruoRegistration } from "@/api/registrationClient";
import { COUNTRY_METADATA, COUNTRY_BY_CODE } from "@/lib/countryMetadata";

export default function CountryRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [countryCode, setCountryCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  const selected = useMemo(() => COUNTRY_BY_CODE[countryCode] || null, [countryCode]);

  useEffect(() => {
    let mounted = true;
    base44.auth.me().then((user) => {
      if (!mounted) return;
      if (user?.xedruo_id) {
        navigate(next, { replace: true });
        return;
      }
      if (user?.country_code && COUNTRY_BY_CODE[user.country_code]) setCountryCode(user.country_code);
      setLoading(false);
    }).catch(() => {
      if (mounted) { setError("Please sign in before completing registration."); setLoading(false); }
    });
    return () => { mounted = false; };
  }, [navigate, next]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const localTime = selected
    ? new Intl.DateTimeFormat("en-US", { timeZone: selected.timeZone, dateStyle: "medium", timeStyle: "medium" }).format(now)
    : "Select your country";

  async function continueRegistration() {
    if (!selected) { setError("Select your country to continue registration."); return; }
    setSaving(true); setError("");
    try {
      await base44.auth.saveRegistrationCountry({ country_code: selected.code, currency_code: selected.currency, time_zone: selected.timeZone, locale: "en" });
      const account = await completeXedruoRegistration({ country_code: selected.code, currency_code: selected.currency, time_zone: selected.timeZone, locale: "en" });
      if (!account?.xedruo_id) throw new Error("Xedruo account creation did not return an ID.");
      navigate(next, { replace: true });
    } catch (err) { setError(err?.message || "Unable to complete Xedruo registration. Please try again."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><Loader2 className="animate-spin text-cyan-300" size={30}/></div>;

  return <div className="min-h-screen bg-slate-950 text-white px-5 py-10 md:py-16">
    <div className="mx-auto max-w-2xl">
      <div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Globe2 size={32}/></div><div className="mt-5 text-xs uppercase tracking-[.3em] text-cyan-300">Step 2 of 2</div><h1 className="mt-2 text-4xl font-black md:text-5xl">Choose your country</h1><p className="mx-auto mt-4 max-w-xl text-slate-400">This sets your default currency, time zone and international service settings before your permanent Xedruo ID is created.</p></div>
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
        <label className="text-sm font-medium text-slate-300">Country of registration</label>
        <select value={countryCode} onChange={(event) => { setCountryCode(event.target.value); setError(""); }} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300/60" required><option value="">Select your country...</option>{COUNTRY_METADATA.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><Coins className="text-cyan-300" size={20}/><div className="mt-3 text-xs text-slate-500">Main currency</div><div className="mt-1 font-semibold">{selected?.currency || "—"}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><Clock3 className="text-cyan-300" size={20}/><div className="mt-3 text-xs text-slate-500">Local time</div><div className="mt-1 font-semibold text-sm">{localTime}</div></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><MapPin className="text-cyan-300" size={20}/><div className="mt-3 text-xs text-slate-500">Default region</div><div className="mt-1 font-semibold">{selected?.name || "—"}</div></div>
        </div>
        <div className="mt-5 flex gap-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4 text-sm text-slate-300"><ShieldCheck className="mt-0.5 shrink-0 text-cyan-300" size={18}/><span>After this step Xedruo creates one permanent 10-digit Xedruo ID for your unified account. It follows you across all 15 Xedruo companies.</span></div>
        {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
        <button onClick={continueRegistration} disabled={!selected || saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={18}/> : null}{saving ? "Creating your Xedruo account…" : "Create Xedruo account & open dashboard"}<ArrowRight size={18}/></button>
      </div>
    </div>
  </div>;
}
