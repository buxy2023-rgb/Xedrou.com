import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Bell, CreditCard, LayoutDashboard, ShieldCheck, Wallet, Loader2, ExternalLink } from "lucide-react";
import { XEDRUO_COMPANIES, XEDRUO_COMPANY_ALIASES } from "./Home";
import { useAuth } from "@/lib/AuthContext";

const COMPANY_MODULES = {
  "pay-and-play": ["Xedruo Pay", "Wallet", "Transfers", "Music", "Tickets", "Artist services"],
  "sportruo": ["Talent acquisition", "Players", "Teams", "Transfers", "Leagues", "Stadiums", "Predictions"],
  "hireruo": ["Find jobs", "Vacancies", "Applications", "CV AI", "Job suggestions", "Employer portal"],
  "adom": ["Marketplace", "Buy & sell", "Services", "Orders", "Adom Rider", "Delivery tracking"],
  "agruo": ["Farmers", "Produce marketplace", "Suppliers", "Farm services", "Storage", "Agricultural logistics"],
  "healthruo": ["Find doctor", "Appointments", "Hospitals", "Pharmacy", "Prescriptions", "Health delivery"],
  "xedruo-education": ["Student portal", "Admissions", "Courses", "Digital library", "Results", "Lecturer portal", "Timetable"],
  "xedruo-capital": ["Portfolio", "Investments", "Funding", "Capital requests", "Reports", "Risk profile"],
  "xedruo-energy": ["Products", "Solar", "Inverters", "Batteries", "Installation", "Warranty", "Energy assessment"],
  "xedruo-logistics": ["Book ride", "Cargo", "Fleet", "Road", "Rail", "Water", "Air", "Live tracking"],
  "xedruo-properties": ["Buy", "Sell", "Rent", "Lease", "Land", "Agents", "Map search", "Viewing"],
  "spacetruo": ["Car software", "Marine software", "Airplane software", "Phone software", "Technology", "Fleet & asset management"],
  "xedruo-ai": ["AI chat", "Website builder", "Code assistant", "Analysis", "Presentations", "Developer workstation"],
  "xedruo-music-distribution": ["Music distribution", "Releases", "Catalog", "Analytics", "Royalties", "Artist management"]
};

const MODULE_ROUTES = {
  "AI chat": "/ai-assistant",
  "Code assistant": "/developer",
  "Developer workstation": "/developer-workstation",
  "Music distribution": "/distribution",
  "Releases": "/distribution",
  "Catalog": "/artist-catalog",
  "Analytics": "/platform-usage",
  "Royalties": "/royalties",
  "Artist management": "/artist-management",
  "Tickets": "/sell-tickets",
  "Artist services": "/artist-management",
  "Music": "/pay-and-play",
  "Wallet": "/pay-and-play",
  "Transfers": "/pay-and-play",
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, isLoadingAuth } = useAuth();
  const requestedSlug = searchParams.get("company") || "pay-and-play";
  const slug = XEDRUO_COMPANY_ALIASES[requestedSlug] || requestedSlug;
  const company = useMemo(() => XEDRUO_COMPANIES.find((item) => item[0] === slug) || XEDRUO_COMPANIES[0], [slug]);
  const [, name, description, , , url] = company;
  const modules = COMPANY_MODULES[slug] || ["Overview", "Services", "Orders", "Account", "Support"];
  const [selectedModule, setSelectedModule] = useState(modules[0]);

  useEffect(() => {
    setSelectedModule(modules[0]);
  }, [slug, modules]);

  useEffect(() => {
    if (!isLoadingAuth && !user) navigate(`/company/${encodeURIComponent(company[0])}`, { replace: true });
  }, [company, navigate, user, isLoadingAuth]);

  if (isLoadingAuth) return <div className="min-h-screen bg-slate-950 grid place-items-center text-white"><div className="text-center"><Loader2 className="mx-auto animate-spin text-cyan-300" size={30}/><div className="mt-3 text-sm text-slate-400">Checking your Xedruo account…</div></div></div>;
  if (!user) return <div className="min-h-screen bg-slate-950 grid place-items-center text-white"><div className="text-sm text-slate-400">Opening secure company access…</div></div>;

  const openModule = (module) => {
    setSelectedModule(module);
    const route = MODULE_ROUTES[module];
    if (route) navigate(route);
  };

  return <div className="min-h-screen bg-slate-950 text-white">
    <header className="border-b border-white/10 bg-slate-950/90 px-5 py-4 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> All companies</button><button onClick={() => logout()} className="text-sm text-slate-400 hover:text-white">Sign out</button></div></header>
    <main className="mx-auto max-w-7xl px-5 py-8 md:py-10">
      <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-6 md:p-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="text-xs uppercase tracking-[.28em] text-cyan-300">Customer dashboard</div><h1 className="mt-2 text-3xl font-black md:text-4xl">{name}</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p></div><a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 hover:text-white"><ExternalLink size={15}/> Company website</a></div><div className="mt-5 w-fit rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"><div className="text-[11px] uppercase tracking-wider text-slate-500">Xedruo ID</div><div className="mt-1 font-semibold tracking-wider">{user?.xedruo_id || "Creating…"}</div></div></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Balance","₦0.00",Wallet],["Transactions","0",CreditCard],["Notifications","0",Bell],["Account","Active",ShieldCheck]].map(([label,value,Icon])=><div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon className="text-cyan-300" size={21}/><div className="mt-5 text-xs text-slate-500">{label}</div><div className="mt-1 text-xl font-bold">{value}</div></div>)}</div>
      <section className="mt-6"><div className="flex items-end justify-between gap-4"><div><div className="text-xs uppercase tracking-[.25em] text-slate-500">Services</div><h2 className="mt-1 text-2xl font-bold">{name} workspace</h2></div><span className="text-xs text-slate-500">{modules.length} modules</span></div><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{modules.map((module) => <button key={module} onClick={() => openModule(module)} className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[.08]"><div className="flex items-center justify-between"><LayoutDashboard className="text-cyan-300" size={19}/><ArrowRight className="text-slate-600 transition group-hover:text-cyan-300" size={16}/></div><div className="mt-5 font-semibold">{module}</div><div className="mt-1 text-xs text-slate-500">{MODULE_ROUTES[module] ? "Open workspace" : "Company service module"}</div></button>)}</div></section>
      <div className="mt-6 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-6"><div className="text-xs uppercase tracking-[.25em] text-cyan-300">Active module</div><h2 className="mt-2 text-xl font-bold">{selectedModule}</h2><p className="mt-2 text-sm leading-6 text-slate-400">You are working inside the {name} customer environment. Company-specific permissions remain separated from your unified Xedruo account.</p></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]"><div className="rounded-2xl border border-white/10 bg-white/5 p-6"><div className="flex items-center gap-2"><LayoutDashboard className="text-cyan-300" size={20}/><h2 className="font-semibold">Unified Xedruo workspace</h2></div><p className="mt-3 text-sm leading-6 text-slate-400">Your Google account, phone, country and Xedruo ID are shared across the ecosystem. Company permissions and services remain separated by product.</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-6"><div className="text-xs uppercase tracking-[.25em] text-slate-500">Account</div><div className="mt-4 text-sm text-slate-300">{user?.email}</div><div className="mt-1 text-sm text-slate-500">{user?.phone_number || "Phone saved during onboarding"}</div><div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-3 text-xs text-slate-400">Your secure sign-in is connected to your unified Xedruo customer account.</div></div></div>
    </main>
  </div>;
}
