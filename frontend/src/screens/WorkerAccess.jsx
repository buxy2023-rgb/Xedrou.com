import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Calculator, Code2, Headphones, Users, BriefcaseBusiness, ShieldCheck, Wallet, Trophy, ShoppingCart, Sprout, HeartPulse, GraduationCap, Building2, SunMedium, Truck, Rocket, BrainCircuit, Music2, LogIn, Eye, EyeOff } from "lucide-react";

const companies = [
  ["xedruo-power-holdings", "Xedruo Group Holdings", "Parent holding company", Building2],
  ["pay-and-play", "Pay & Play", "Digital wallet, payments, music, artist services & tickets", Wallet],
  ["sportruo", "Sportruo", "Sports ecosystem", Trophy],
  ["hireruo", "Hireruo", "Hiring & workforce", Users],
  ["adom", "Adom", "Marketplace & services", ShoppingCart],
  ["agruo", "Agruo", "Agriculture", Sprout],
  ["healthruo", "Healthruo", "Health", HeartPulse],
  ["xedruo-education", "Xedruo Education", "Education", GraduationCap],
  ["xedruo-capital", "Xedruo Capital", "Finance & investment", BarChart3],
  ["xedruo-energy", "Xedruo Energy", "Energy", SunMedium],
  ["xedruo-logistics", "Xedruo Logistics", "Logistics", Truck],
  ["xedruo-properties", "Xedruo Properties", "Properties", Building2],
  ["spacetruo", "Spacetruo", "Technology, aviation, marine & automotive", Rocket],
  ["xedruo-ai", "ELinit AI", "AI services", BrainCircuit],
  ["xedruo-music-distribution", "Xedruo Music Distribution", "Music distribution", Music2]
];

const roles = [
  { id: "developer", name: "Developer", desc: "Open your assigned Developer Workstation", Icon: Code2 },
  { id: "accountant", name: "Accountant", desc: "Finance, sales and transaction operations", Icon: Calculator },
  { id: "customer_service", name: "Customer Service", desc: "Customer queries and service operations", Icon: Headphones },
  { id: "chief_of_staff", name: "Chief of Staff", desc: "Management access, developers and workflow control", Icon: Users },
  { id: "governor", name: "Governor", desc: "Executive authority across Xedruo units", Icon: BarChart3 }
];

export default function WorkerAccess() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [governor, setGovernor] = useState("miracle");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login() {
    setError("");
    setBusy(true);
    try {
      const loginName = selectedRole.id === "governor" ? governor : username.trim().toLowerCase();
      const res = await fetch("/api/workforce/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: loginName, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      if (selectedRole.id !== data.account.role) throw new Error(`This login belongs to ${data.account.role.replaceAll("_", " ")}. Select the correct function.`);
      localStorage.setItem("xedruo_workforce_token", data.token);
      localStorage.setItem("xedruo_workforce_account", JSON.stringify(data.account));
      if (data.account.company_slug) localStorage.setItem("xedruo_selected_company", data.account.company_slug);
      if (data.account.role === "developer") navigate("/developer-workstation");
      else if (data.account.role === "chief_of_staff") navigate("/chief-of-staff");
      else if (data.account.role === "governor") navigate(`/governor?governor=${encodeURIComponent(data.account.username)}`);
      else navigate(data.account.role === "accountant" ? "/accountant" : "/customer-service");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (selectedRole) {
    return <div className="min-h-screen bg-slate-950 p-5 text-white md:p-10"><div className="mx-auto max-w-lg">
      <button onClick={() => { setSelectedRole(null); setError(""); setShowPassword(false); }} className="mb-6 flex items-center gap-2 text-sm text-slate-400"><ArrowRight className="rotate-180" size={16}/> Back to Staff & Manager portal</button>
      <div className="rounded-3xl border border-cyan-300/20 bg-white/5 p-7">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-300/10 p-3"><ShieldCheck className="text-cyan-300"/></div><div><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Secure workforce access</div><h1 className="mt-1 text-2xl font-bold">{selectedRole.name} login</h1></div></div>
        {selectedRole.id === "governor" && <><label className="mt-7 block text-sm text-slate-300">Governor</label><select value={governor} onChange={e => setGovernor(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-4"><option value="miracle">Olowolafe Miracle</option><option value="blessing">Olowolafe Blessing</option></select></>}
        {selectedRole.id !== "governor" && <><label className="mt-7 block text-sm text-slate-300">Username</label><input value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="none" autoComplete="username" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-4 outline-none" placeholder="Enter username"/></>}
        <label className="mt-4 block text-sm text-slate-300">Password</label>
        <div className="relative mt-2">
          <input value={password} onChange={e => setPassword(e.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" className="w-full rounded-xl border border-white/10 bg-slate-900 p-4 pr-12 outline-none" placeholder="Enter password" onKeyDown={e => e.key === "Enter" && login()}/>
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
            {showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}<span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
          </button>
        </div>
        {error && <div className="mt-4 rounded-xl border border-red-300/20 bg-red-300/5 p-3 text-sm text-red-200">{error}</div>}
        <button disabled={busy || !password || (selectedRole.id !== "governor" && !username)} onClick={login} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 p-4 font-semibold text-slate-950 disabled:opacity-40"><LogIn size={18}/>{busy ? "Signing in…" : "Sign in"}</button>
        <p className="mt-4 text-xs leading-5 text-slate-500">Access is permission-controlled server-side. After a successful login, Xedruo automatically opens the dashboard assigned to that account. Developers do not select Elinit or a project here; they open their assigned workstation.</p>
      </div>
    </div></div>;
  }

  return <div className="min-h-screen bg-slate-950 p-5 text-white md:p-8"><div className="mx-auto max-w-7xl">
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Xedruo internal portal</div><h1 className="mt-2 text-3xl font-black md:text-4xl">Our 15 companies</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Staff and managers use this internal company directory. Customers do not enter through this page.</p></div><a href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">Customer experience</a></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{companies.map(([slug, name, description, Icon], index) => <div key={slug} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-300/30 hover:bg-white/[.08] md:p-5"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-300"><Icon size={21}/></div><span className="text-[11px] font-semibold text-slate-600">{String(index + 1).padStart(2, "0")}</span></div><div className="mt-4 min-h-[58px]"><h3 className="text-sm font-semibold leading-5 md:text-[15px]">{name}</h3><p className="mt-1 text-[11px] leading-4 text-slate-500">{description}</p></div></div>)}</div>
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6"><div className="flex items-center gap-3"><BriefcaseBusiness className="text-cyan-300"/><div><h2 className="font-semibold">Choose your internal function</h2><p className="mt-1 text-sm text-slate-500">Your permissions determine the workstation you receive. Developers are routed to their own assigned workstation.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{roles.map(({ id, name, desc, Icon }) => <button key={id} onClick={() => setSelectedRole({ id, name, desc })} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left hover:border-cyan-300/40 hover:bg-cyan-300/10"><Icon className="text-cyan-300" size={21}/><div className="mt-3 font-semibold">{name}</div><div className="mt-1 text-xs leading-5 text-slate-500">{desc}</div><div className="mt-3 flex items-center gap-1 text-xs font-semibold text-cyan-300">Open access <ArrowRight size={13}/></div></button>)}</div></section>
    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-4 text-sm leading-6 text-slate-400"><Building2 className="mt-1 shrink-0 text-cyan-300" size={18}/><span>This is the <strong className="text-slate-200">Staff & Manager landing page</strong>. It is separate from the public Xedruo customer experience.</span></div>
  </div></div>;
}
