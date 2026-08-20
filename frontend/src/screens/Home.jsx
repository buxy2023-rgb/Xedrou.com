import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Users, Code2, Calculator, Headphones, Wallet, Trophy, ShoppingCart, Sprout, HeartPulse, GraduationCap, BarChart3, SunMedium, Truck, Rocket, BrainCircuit, Music2, UserCog, Gauge } from "lucide-react";
import Logo from "@/components/marketing/Logo";

export const XEDRUO_COMPANIES = [
  ["pay-and-play","Pay & Play","Digital wallet, payments, music, artist services & tickets",Wallet,"text-blue-300","https://xedruo-pay-and-play.onrender.com"],
  ["sportruo","Sportruo","Sports ecosystem, talent & competitions",Trophy,"text-lime-300","https://xedruo-sportruo.onrender.com"],
  ["hireruo","Hireruo","Hiring, vacancies & workforce",Users,"text-violet-300","https://xedruo-hireruo.onrender.com"],
  ["adom","Adom","Marketplace, services & delivery",ShoppingCart,"text-orange-300","https://xedruo-adom.onrender.com"],
  ["agruo","Agruo","Agriculture ecosystem",Sprout,"text-green-300","https://xedruo-agruo.onrender.com"],
  ["heathrou","Healthruo","Healthcare, hospitals & pharmacy",HeartPulse,"text-red-300","https://xedruo-healthruo.onrender.com"],
  ["xedruo-education","Xedruo Education","Learning, schools & academic portals",GraduationCap,"text-indigo-300","https://xedruo-education.onrender.com"],
  ["xedruo-capital","Xedruo Capital","Finance & investment ecosystem",BarChart3,"text-amber-300","https://xedruo-capital.onrender.com"],
  ["xedruo-energy","Xedruo Energy","Energy, batteries, solar & inverter solutions",SunMedium,"text-yellow-300","https://xedruo-energy.onrender.com"],
  ["xedruo-logistics","Xedruo Logistics","Road, rail, water & air logistics",Truck,"text-cyan-300","https://xedruo-logistics.onrender.com"],
  ["xedruo-properties","Xedruo Properties","Property, land, leasing & renting",Building2,"text-sky-300","https://xedruo-properties.onrender.com"],
  ["spacetruo","Spacetruo","Space, aviation, marine, automotive & technology",Rocket,"text-fuchsia-300","https://xedruo-spacetruo.onrender.com"],
  ["xedruo-ai","ELinit AI","AI for Xedruo developers and the public",BrainCircuit,"text-pink-300","https://xedruo-elinit-ai.onrender.com"],
  ["xedruo","Xedruo Music Distribution","Music distribution platform",Music2,"text-rose-300","https://xedruo-music-distribution.onrender.com"]
];

const roles = [
  [Code2,"Developer","Build and edit company websites and technology backends."],
  [BrainCircuit,"CTO","Manage technology architecture, engineering standards, security and technical direction."],
  [Gauge,"Governor — Operations","Review weekly, monthly and yearly company performance and operations."],
  [Calculator,"Accountant","See sales, income, expenses and transaction health."],
  [Headphones,"Customer Service","Manage customer questions, replies and case status."],
  [UserCog,"HR","Register, assign and remove company staff."],
  [BarChart3,"Governor — Finance","Review finance, sales, expenses and growth opportunities."]
];

export default function Home(){
  const navigate = useNavigate();
  const hostedCompany = process.env.NEXT_PUBLIC_COMPANY_SLUG || "";
  useEffect(() => { if (hostedCompany) navigate(`/company/${hostedCompany}`, { replace: true }); }, [hostedCompany, navigate]);
  if (hostedCompany) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-cyan-300"/><p className="text-sm text-slate-400">Opening Xedruo company...</p></div></div>;
  return <div className="min-h-screen bg-slate-950 text-white">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Logo/><Link to="/worker-access" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:border-cyan-300/30 hover:text-white">Manage Company</Link></header>
    <section className="mx-auto max-w-7xl px-5 pb-14 pt-10 text-center md:pt-14"><div className="mx-auto max-w-4xl"><div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Building2/></div><div className="text-xs font-semibold uppercase tracking-[.35em] text-cyan-300">Xedruo Hosting Company</div><h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">One group. <span className="text-cyan-300">14 companies.</span></h1><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">The main Xedruo hosting and landing platform. Choose any company to open its independent website.</p></div></section>
    <section className="border-y border-white/10 bg-white/[.025] px-5 py-10"><div className="mx-auto max-w-7xl"><div className="mb-6 flex items-end justify-between"><div><div className="text-xs uppercase tracking-[.3em] text-slate-500">14 companies</div><h2 className="mt-1 text-2xl font-bold md:text-3xl">Choose a company</h2></div><span className="text-sm text-slate-500">15 cards total</span></div>
      <div className="mb-3"><Link to="/worker-access" className="group flex items-center justify-between rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4 hover:bg-cyan-300/10"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-300"><Building2 size={21}/></div><div><h3 className="font-semibold">01 · Manage Company</h3><p className="text-xs text-slate-500">Developer · CTO · Governor · Accountant · Customer Service · HR</p></div></div><ArrowRight className="text-cyan-300" size={18}/></Link></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{XEDRUO_COMPANIES.map(([slug,name,type,Icon,iconClass,url],i)=><a key={slug} href={url} className="group min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[.08] md:p-5"><div className="flex items-center justify-between gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ${iconClass}`}><Icon size={21} strokeWidth={1.8}/></div><span className="text-[11px] font-semibold text-slate-600">{String(i+2).padStart(2,"0")}</span></div><div className="mt-4 min-h-[58px]"><h3 className="text-sm font-semibold leading-5 text-white md:text-[15px]">{name}</h3><p className="mt-1 text-[11px] leading-4 text-slate-500">{type}</p></div><div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-cyan-300 opacity-80 transition group-hover:opacity-100">Open website <ArrowRight size={13}/></div></a>)}</div>
    </div></section>
    <section className="mx-auto max-w-7xl px-5 py-14"><div className="text-center"><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Manage Company</div><h2 className="mt-2 text-2xl font-bold md:text-3xl">Management & workforce roles</h2><p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">All management roles are together in one secure workstation.</p></div><div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{roles.map(([Icon,title,desc])=><div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon className="text-cyan-300" size={21}/><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p></div>)}</div></section>
  </div>;
}
