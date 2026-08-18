import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Users, Code2, Calculator, Headphones } from "lucide-react";
import Logo from "@/components/marketing/Logo";
import { Button } from "@/components/ui/button";

const companies = [
  ["xedruo-power-holdings","Xedruo Power Holdings","Parent / Holding Company"],
  ["pay-and-play","Pay & Play","Wallet, payments, music, artist gifting, booking & tickets"],
  ["sportruo","Sportruo","Sports"],
  ["hireruo","Hireruo","Hiring & Workforce"],
  ["adom","Adom","Marketplace & Services"],
  ["agruo","Agruo","Agriculture"],
  ["heathrou","Heathrou","Health"],
  ["xedruo-education","Xedruo Education","Education"],
  ["xedruo-capital","Xedruo Capital","Finance & Investment"],
  ["xedruo-energy","Xedruo Energy","Energy"],
  ["xedruo-logistics","Xedruo Logistics","Logistics"],
  ["xedruo-properties","Xedruo Properties","Real Estate"],
  ["spacetruo","Spacetruo","Space & Aerospace"],
  ["xedruo-ai","Xedruo AI","Artificial Intelligence"],
  ["xedruo","Xedruo","Core Xedruo Services"]
];
const roles = [[Code2,"Developer","Build and edit your company's website and technology backend."],[Calculator,"Accountant","See financial records and income statements for your company."],[Headphones,"Customer Service","Manage customer questions, cases and service status."],[Users,"Staff","Access your company's internal operations workspace."]];

export default function Home(){
  return <div className="min-h-screen bg-slate-950 text-white"><header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Logo/><Link to="/login" className="text-sm text-slate-300 hover:text-white">Staff / Company Login</Link></header>
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 text-center"><div className="mx-auto max-w-4xl"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Building2/></div><div className="text-xs font-semibold uppercase tracking-[.35em] text-cyan-300">Xedruo Power Holdings</div><h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl">One AI. One ecosystem. <span className="text-cyan-300">15 companies.</span></h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">The private operating platform for Xedruo Power Holdings and its companies. Customers interact directly with the company they choose.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/worker-access"><Button size="lg" className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">I work for a company <ArrowRight className="ml-2" size={17}/></Button></Link></div></div></section>
    <section className="border-y border-white/10 bg-white/[.025] px-5 py-16"><div className="mx-auto max-w-7xl"><div className="mb-8 flex items-end justify-between"><div><div className="text-xs uppercase tracking-[.3em] text-slate-500">The group</div><h2 className="mt-2 text-3xl font-bold">Our companies</h2></div><span className="text-sm text-slate-500">15 total</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{companies.map(([slug,name,type],i)=><div key={slug} className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="text-xs text-cyan-300">{String(i+1).padStart(2,"0")}</div><h3 className="mt-2 font-semibold">{name}</h3><p className="mt-1 text-sm text-slate-500">{type}</p></div>)}</div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-20"><div className="text-center"><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Workforce platform</div><h2 className="mt-3 text-3xl font-bold">Your job. Your company. Your workspace.</h2><p className="mx-auto mt-3 max-w-2xl text-slate-400">Every worker is directed to the tools they need after secure company authorization.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{roles.map(([Icon,title,desc])=><div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6"><Icon className="text-cyan-300"/><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p></div>)}</div><div className="mt-10 text-center"><Link to="/worker-access" className="inline-flex items-center gap-2 text-cyan-300">Company staff access <ArrowRight size={16}/></Link></div></section>
    <section className="mx-auto max-w-5xl px-5 pb-24"><div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-10 text-center"><h2 className="text-3xl font-bold">Xedruo Company AI</h2><p className="mx-auto mt-3 max-w-2xl text-slate-400">The private strategic AI that helps the group plan, build, analyze, operate and coordinate every company.</p><Link to="/login" className="mt-7 inline-flex rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Staff / Company Login</Link></div></section>
  </div>;
}