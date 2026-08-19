import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, Users, Code2, Calculator, Headphones, Wallet, Plane, Trophy, BriefcaseBusiness, ShoppingCart, Sprout, HeartPulse, GraduationCap, BarChart3, SunMedium, Truck, Rocket, BrainCircuit, Music2 } from "lucide-react";
import Logo from "@/components/marketing/Logo";
import { Button } from "@/components/ui/button";

const companies = [
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
const roles = [[Code2,"Developer","Build and edit your company's website and technology backend."],[Calculator,"Accountant","See financial records and income statements for your company."],[Headphones,"Customer Service","Manage customer questions, cases and service status."],[Users,"Staff","Access your company's internal operations workspace."]];

export default function Home(){
  return <div className="min-h-screen bg-slate-950 text-white"><header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Logo/><Link to="/login" className="text-sm text-slate-300 hover:text-white">Staff / Company Login</Link></header>
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 text-center"><div className="mx-auto max-w-4xl"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Building2/></div><div className="text-xs font-semibold uppercase tracking-[.35em] text-cyan-300">Xedruo Group Holdings</div><h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl">Powering <span className="text-cyan-300">15 companies.</span></h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">Xedruo Group Holdings is the parent holding company overseeing a diversified portfolio of 15 independent businesses through shared strategic direction, governance, technology and infrastructure.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/worker-access"><Button size="lg" className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">I work for a company <ArrowRight className="ml-2" size={17}/></Button></Link></div></div></section>
    <section className="border-y border-white/10 bg-white/[.025] px-5 py-16"><div className="mx-auto max-w-7xl"><div className="mb-8 flex items-end justify-between"><div><div className="text-xs uppercase tracking-[.3em] text-slate-500">The group</div><h2 className="mt-2 text-3xl font-bold">Our 15 companies</h2></div><span className="text-sm text-slate-500">15 total</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{companies.map(([slug,name,type,Icon,iconClass],i)=><div key={slug} className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[.08]"><div className="flex items-start justify-between"><div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ${iconClass}`}><Icon size={25} strokeWidth={1.8}/></div><div className="text-xs font-semibold text-cyan-300">{String(i+1).padStart(2,"0")}</div></div><h3 className="mt-5 font-semibold">{name}</h3><p className="mt-1 text-sm text-slate-500">{type}</p></div>)}</div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-20"><div className="text-center"><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Workforce platform</div><h2 className="mt-3 text-3xl font-bold">Your job. Your company. Your workspace.</h2><p className="mx-auto mt-3 max-w-2xl text-slate-400">Every worker is directed to the tools they need after secure company authorization.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{roles.map(([Icon,title,desc])=><div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6"><Icon className="text-cyan-300"/><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p></div>)}</div><div className="mt-10 text-center"><Link to="/worker-access" className="inline-flex items-center gap-2 text-cyan-300">Company staff access <ArrowRight size={16}/></Link></div></section>
    <section className="mx-auto max-w-5xl px-5 pb-24"><div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-10 text-center"><h2 className="text-3xl font-bold">Xedruo Company AI</h2><p className="mx-auto mt-3 max-w-2xl text-slate-400">The private strategic AI that helps the group plan, build, analyze, operate and coordinate every company.</p><Link to="/login" className="mt-7 inline-flex rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950">Staff / Company Login</Link></div></section>
  </div>;
}