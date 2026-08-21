import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";

export default function GoogleWorkforceComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  useEffect(() => {
    try {
      const token = searchParams.get("workforce_token");
      if (!token) throw new Error("Google sign-in did not return a workforce session.");
      const raw = JSON.parse(atob(token.replace(/-/g,"+").replace(/_/g,"/") + "=="));
      if (!raw.email || !raw.role) throw new Error("Google identity could not be verified.");
      if (Date.now() - Number(raw.iat || 0) > 10 * 60 * 1000) throw new Error("Google sign-in expired. Please try again.");
      localStorage.setItem("xedruo_workforce_token", token);
      localStorage.setItem("xedruo_workforce_account", JSON.stringify({ id:`google:${raw.email}`, username:raw.email, display_name:raw.name || raw.email, email:raw.email, role:raw.role, company_slug:raw.company_slug || "xedruo", is_active:true }));
      if (raw.role === "developer") navigate("/developer-workstation", { replace:true });
      else if (raw.role === "chief_of_staff") navigate("/chief-of-staff", { replace:true });
      else if (raw.role === "governor") navigate("/governor", { replace:true });
      else navigate("/worker-access", { replace:true });
    } catch (e) { setError(e?.message || "Google workforce sign-in failed."); }
  }, [navigate, searchParams]);
  if (error) return <div className="min-h-screen bg-slate-950 px-5 text-white grid place-items-center"><div className="max-w-md rounded-3xl border border-red-300/20 bg-white/5 p-7 text-center"><ShieldCheck className="mx-auto text-red-300" size={30}/><h1 className="mt-4 text-xl font-bold">Google sign-in failed</h1><p className="mt-3 text-sm leading-6 text-red-100/80">{error}</p><button onClick={()=>navigate("/worker-access")} className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900">Try again</button></div></div>;
  return <div className="min-h-screen bg-slate-950 text-white grid place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-cyan-300" size={34}/><p className="mt-4 text-sm text-slate-400">Signing you into your Xedruo workstation…</p></div></div>;
}
