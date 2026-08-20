import React, { useEffect } from "react";
import { ArrowLeft, ArrowRight, Bell, CreditCard, LayoutDashboard, ShieldCheck, Wallet } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { XEDRUO_COMPANIES } from "./Home";
import { useAuth } from "@/lib/AuthContext";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const slug = searchParams.get("company") || "xedruo";
  const company = XEDRUO_COMPANIES.find((item) => item[0] === slug) || XEDRUO_COMPANIES[14];
  const [, name, description] = company;

  useEffect(() => { if (!user) navigate(`/company/${encodeURIComponent(company[0])}`, { replace: true }); }, [company, navigate, user]);
  if (!user) return <div className="min-h-screen bg-slate-950 grid place-items-center text-white"><div className="text-sm text-slate-400">Checking your Xedruo account…</div></div>;

  return <div className="min-h-screen bg-slate-950 text-white">
    <header className="border-b border-white/10 bg-slate-950/90 px-5 py-4 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> All companies</button><button onClick={() => logout()} className="text-sm text-slate-400 hover:text-white">Sign out</button></div></header>
    <main className="mx-auto max-w-7xl px-5 py-8 md:py-10">
      <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/5 p-6 md:p-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="text-xs uppercase tracking-[.28em] text-cyan-300">Customer dashboard</div><h1 className="mt-2 text-3xl font-black md:text-4xl">{name}</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p></div><div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"><div className="text-[11px] uppercase tracking-wider text-slate-500">Xedruo ID</div><div className="mt-1 font-semibold">{user?.xedruo_id || user?.id?.slice(0, 12) || "XDR-ACCOUNT"}</div></div></div></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Balance","₦0.00",Wallet],["Transactions","0",CreditCard],["Notifications","0",Bell],["Account","Verified",ShieldCheck]].map(([label,value,Icon])=><div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon className="text-cyan-300" size={21}/><div className="mt-5 text-xs text-slate-500">{label}</div><div className="mt-1 text-xl font-bold">{value}</div></div>)}</div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]"><div className="rounded-2xl border border-white/10 bg-white/5 p-6"><div className="flex items-center gap-2"><LayoutDashboard className="text-cyan-300" size={20}/><h2 className="font-semibold">Your Xedruo workspace</h2></div><p className="mt-3 text-sm leading-6 text-slate-400">This is your customer-facing entry point. From here, company features, purchases, bookings, payments and account services can open inside the selected Xedruo company.</p><button onClick={() => navigate(`/company/${company[0]}`)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950">Company entry <ArrowRight size={16}/></button></div><div className="rounded-2xl border border-white/10 bg-white/5 p-6"><div className="text-xs uppercase tracking-[.25em] text-slate-500">Account</div><div className="mt-4 text-sm text-slate-300">{user?.email}</div><div className="mt-1 text-sm text-slate-500">{user?.phone_number || "Phone saved during onboarding"}</div><div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/5 p-3 text-xs text-slate-400">Google sign-in is connected to your Xedruo customer account.</div></div></div>
    </main>
  </div>;
}
