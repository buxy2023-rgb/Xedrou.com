import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Users, Code2, Calculator, Headphones, Wallet, Trophy, ShoppingCart, Sprout, HeartPulse, GraduationCap, BarChart3, SunMedium, Truck, Rocket, BrainCircuit, Music2, UserCog, Gauge } from "lucide-react";
import Logo from "@/components/marketing/Logo";
import { Button } from "@/components/ui/button";

export const XEDRUO_COMPANIES = [
  ["xedruo-power-holdings","Xedruo Group Holdings","Parent holding company",Building2,"text-amber-300"],
  ["pay-and-play","Pay & Play","Digital wallet, payments, music, artist services & tickets",Wallet,"text-blue-300"],
  ["sportruo","Sportruo","Sports",Trophy,"text-lime-300"],
  ["hireruo","Hireruo","Hiring & Workforce",Users,"text-violet-300"],
  ["adom","Adom","Marketplace & Services",ShoppingCart,"text-orange-300"],
  ["agruo","Agruo","Agriculture",Sprout,"text-green-300"],
  ["heathrou","Heathrou","Health",HeartPulse,"text-red-300"],
  ["xedruo-education","Xedruo Education","Education",GraduationCap,"text-indigo-300"],
  ["xedruo-capital","Xedruo Capital","Finance & Investment",BarChart3,"text-amber-300"],
  ["xedruo-energy","Xedruo Energy","Energy, Solar & Inverter Solutions",SunMedium,"text-yellow-300"],
  ["xedruo-logistics","Xedruo Logistics","Logistics",Truck,"text-cyan-300"],
  ["xedruo-properties","Xedruo Properties","Real Estate",Building2,"text-sky-300"],
  ["spacetruo","Spacetruo","Space & Flight",Rocket,"text-fuchsia-300"],
  ["enit-ai","Enit AI","Artificial Intelligence",BrainCircuit,"text-pink-300"],
  ["xedruo","Xedruo","Music Distribution Platform",Music2,"text-rose-300"]
];

const roles = [
  [Code2,"Developer","Build and edit your company's website and technology backend."],
  [Calculator,"Accountant","See sales, income, expenses and transaction health."],
  [Headphones,"Customer Service","Manage customer questions, replies and case status."],
  [UserCog,"HR","Register, assign and remove company staff."],
  [Gauge,"Governor — Operations","Review weekly, monthly and yearly company performance."],
  [BarChart3,"Governor — Finance","Review finance, sales, expenses and growth opportunities."]
];

export default function Home(){
  return <div className="min-h-screen bg-slate-950 text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Logo/><Link to="/worker-access" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:border-cyan-300/30 hover:text-white">Workforce access</Link></header>
    <section className="mx-auto max-w-7xl px-5 pb-14 pt-10 text-center md:pt-14"><div className="mx-auto max-w-4xl"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Building2/></div><div className="text-xs font-semibold uppercase tracking-[.35em] text-cyan-300">Xedruo Group Holdings</div><h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Powering <span className="text-cyan-300">15 companies.</span></h1><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">One secure entry point for every Xedruo company, customer dashboard and workforce workstation.</p></div></section>
    <section className="border-y border-white/10 bg-white/[.025] px-5 py-10"><div className="mx-auto max-w-7xl"><div className="mb-6 flex items-end justify-between"><div><div className="text-xs uppercase tracking-[.3em] text-slate-500">The group</div><h2 className="mt-1 text-2xl font-bold md:text-3xl">Choose a company</h2></div><span className="text-sm text-slate-500">15 total</span></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{XEDRUO_COMPANIES.map(([slug,name,type,Icon,iconClass],i)=><Link key={slug} to={`/company/${slug}`} className="group min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[.08] md:p-5"><div className="flex items-center justify-between gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ${iconClass}`}><Icon size={21} strokeWidth={1.8}/></div><span className="text-[11px] font-semibold text-slate-600">{String(i+1).padStart(2,"0")}</span></div><div className="mt-4 min-h-[50px]"><h3 className="text-sm font-semibold leading-5 text-white md:text-[15px]">{name}</h3><p className="mt-1 text-[11px] leading-4 text-slate-500">{type}</p></div><div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-cyan-300 opacity-80 transition group-hover:opacity-100">Open dashboard <ArrowRight size={13}/></div></Link>)}</div>
    </div></section>
    <section className="mx-auto max-w-7xl px-5 py-14"><div className="text-center"><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Workforce platform</div><h2 className="mt-2 text-2xl font-bold md:text-3xl">Your job. Your company. Your workstation.</h2><p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">Choose a function and Xedruo sends you directly to the tools for that role.</p></div><div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{roles.map(([Icon,title,desc])=><div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon className="text-cyan-300" size={21}/><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p></div>)}</div></section>
  </div>;
}
