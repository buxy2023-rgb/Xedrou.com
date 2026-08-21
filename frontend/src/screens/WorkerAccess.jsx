import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Calculator, Code2, Headphones, Users, BriefcaseBusiness, ShieldCheck, Wallet, Trophy, ShoppingCart, Sprout, HeartPulse, GraduationCap, Building2, SunMedium, Truck, Rocket, BrainCircuit, Music2, LogIn } from "lucide-react";

const companies = [
  ["xedruo-power-holdings", "Xedruo Group Holdings", "Parent holding company", Building2], ["pay-and-play", "Pay & Play", "Digital wallet, payments, music, artist services & tickets", Wallet], ["sportruo", "Sportruo", "Sports ecosystem", Trophy], ["hireruo", "Hireruo", "Hiring & workforce", Users], ["adom", "Adom", "Marketplace & services", ShoppingCart], ["agruo", "Agruo", "Agriculture", Sprout], ["healthruo", "Healthruo", "Health", HeartPulse], ["xedruo-education", "Xedruo Education", "Education", GraduationCap], ["xedruo-capital", "Xedruo Capital", "Finance & investment", BarChart3], ["xedruo-energy", "Xedruo Energy", "Energy", SunMedium], ["xedruo-logistics", "Xedruo Logistics", "Logistics", Truck], ["xedruo-properties", "Xedruo Properties", "Properties", Building2], ["spacetruo", "Spacetruo", "Technology, aviation, marine & automotive", Rocket], ["xedruo-ai", "ELinit AI", "AI services", BrainCircuit], ["xedruo-music-distribution", "Xedruo Music Distribution", "Music distribution", Music2]
];

const roles = [
  { id: "developer", name: "Developer", desc: "Open your assigned Developer Workstation", Icon: Code2, google: true },
  { id: "accountant", name: "Accountant", desc: "Finance, sales and transaction operations", Icon: Calculator, google: false },
  { id: "customer_service", name: "Customer Service", desc: "Customer queries and service operations", Icon: Headphones, google: false },
  { id: "chief_of_staff", name: "Chief of Staff", desc: "Management access, developers and workflow control", Icon: Users, google: true },
  { id: "governor", name: "Governor", desc: "Executive authority across Xedruo units", Icon: BarChart3, google: true }
];

export default function WorkerAccess() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [governor, setGovernor] = useState("miracle");

  function continueWithGoogle(roleId) {
    const role = roleId === "governor" ? `${roleId}&governor=${encodeURIComponent(governor)}` : roleId;
    window.location.assign(`/api/auth/google?service=workforce&role=${encodeURIComponent(roleId)}${roleId === "governor" ? `&governor=${encodeURIComponent(governor)}` : ""}`);
  }

  if (selectedRole) {
    const isGoogleRole = selectedRole.google;
    return <div className="min-h-screen bg-slate-950 p-5 text-white md:p-10"><div className="mx-auto max-w-lg">
      <button onClick={() => setSelectedRole(null)} className="mb-6 flex items-center gap-2 text-sm text-slate-400"><ArrowRight className="rotate-180" size={16}/> Back to Staff & Manager portal</button>
      <div className="rounded-3xl border border-cyan-300/20 bg-white/5 p-7">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-300/10 p-3"><ShieldCheck className="text-cyan-300"/></div><div><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Secure workforce access</div><h1 className="mt-1 text-2xl font-bold">{selectedRole.name} access</h1></div></div>
        {selectedRole.id === "governor" && <><label className="mt-7 block text-sm text-slate-300">Governor</label><select value={governor} onChange={e => setGovernor(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-4"><option value="miracle">Olowolafe Miracle</option><option value="blessing">Olowolafe Blessing</option></select></>}
        {isGoogleRole ? <>
          <p className="mt-6 text-sm leading-6 text-slate-400">Use the Google account assigned to this Xedruo workforce role. Xedruo checks the verified Google email against the authorized workforce account before opening the workstation.</p>
          <button onClick={() => continueWithGoogle(selectedRole.id)} className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 font-bold text-slate-900 hover:bg-slate-100"><span className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 text-sm font-black">G</span>Continue with Google</button>
          <p className="mt-4 text-center text-xs text-slate-500">Only authorized Xedruo workforce Google accounts can enter.</p>
        </> : <div className="mt-7 rounded-2xl border border-white/10 bg-slate-900 p-5"><LogIn className="text-cyan-300" size={22}/><h2 className="mt-3 font-semibold">Workforce sign-in</h2><p className="mt-2 text-sm leading-6 text-slate-400">Password workforce login has been retired. Google identity access is currently enabled for Developer, Chief of Staff and Governor roles.</p></div>}
      </div>
    </div></div>;
  }

  return <div className="min-h-screen bg-slate-950 p-5 text-white md:p-8"><div className="mx-auto max-w-7xl">
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Xedruo internal portal</div><h1 className="mt-2 text-3xl font-black md:text-4xl">Our 15 companies</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Staff and managers use this internal company directory. Customers do not enter through this page.</p></div><a href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">Customer experience</a></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{companies.map(([slug, name, description, Icon], index) => <div key={slug} className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-300"><Icon size={21}/></div><span className="text-[11px] font-semibold text-slate-600">{String(index + 1).padStart(2, "0")}</span></div><div className="mt-4 min-h-[58px]"><h3 className="text-sm font-semibold leading-5 md:text-[15px]">{name}</h3><p className="mt-1 text-[11px] leading-4 text-slate-500">{description}</p></div></div>)}</div>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6"><div className="flex items-center gap-3"><BriefcaseBusiness className="text-cyan-300"/><div><h2 className="font-semibold">Choose your internal function</h2><p className="mt-1 text-sm text-slate-500">Google identity access is enabled for Developer, Chief of Staff and Governor.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{roles.map(({ id, name, desc, Icon, google }) => <button key={id} onClick={() => setSelectedRole({ id, name, desc, google })} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left hover:border-cyan-300/40 hover:bg-cyan-300/10"><Icon className="text-cyan-300" size={21}/><div className="mt-3 font-semibold">{name}</div><div className="mt-1 text-xs leading-5 text-slate-500">{desc}</div><div className="mt-3 flex items-center gap-1 text-xs font-semibold text-cyan-300">{google ? "Continue with Google" : "Open access"} <ArrowRight size={13}/></div></button>)}</div></section>
    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4 text-sm leading-6 text-slate-400"><Building2 className="mt-1 shrink-0 text-cyan-300" size={18}/><span>This is the <strong className="text-slate-200">Staff & Manager landing page</strong>. It is separate from the public Xedruo customer experience.</span></div>
  </div></div>;
}
