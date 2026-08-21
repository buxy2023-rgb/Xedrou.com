import React from "react";
import { ArrowRight, BrainCircuit, GraduationCap, HeartPulse, Music2, Rocket, ShoppingCart, Sprout, Trophy, Truck, Users, Wallet, Building2, BarChart3 } from "lucide-react";
import Logo from "@/components/marketing/Logo";

const companies = [
  ["Pay & Play", "Payments, wallet, music, tickets and artist services", Wallet, "https://xedruo-pay-and-play.onrender.com"],
  ["Sportruo", "Sports, talent, competitions and sports experiences", Trophy, "https://xedruo-sportruo.onrender.com"],
  ["Hireruo", "Find work, hire people and manage workforce needs", Users, "https://xedruo-hireruo.onrender.com"],
  ["Adom", "Shop for products and request everyday services", ShoppingCart, "https://xedruo-adom.onrender.com"],
  ["Agruo", "Agriculture products, services and opportunities", Sprout, "https://xedruo-agruo.onrender.com"],
  ["Healthruo", "Healthcare and health-related services", HeartPulse, "https://xedruo-healthruo.onrender.com"],
  ["Xedruo Education", "Learning, schools and academic services", GraduationCap, "https://xedruo-education.onrender.com"],
  ["Xedruo Capital", "Finance and investment ecosystem", BarChart3, "https://xedruo-capital.onrender.com"],
  ["Xedruo Energy", "Energy, solar, battery and power solutions", Building2, "https://xedruo-energy.onrender.com"],
  ["Xedruo Logistics", "Move goods and access logistics services", Truck, "https://xedruo-logistics.onrender.com"],
  ["Xedruo Properties", "Property, land, leasing and renting", Building2, "https://xedruo-properties.onrender.com"],
  ["Spacetruo", "Technology, aviation, marine, automotive and space", Rocket, "https://xedruo-spacetruo.onrender.com"],
  ["ELinit AI", "AI assistance for public users and Xedruo developers", BrainCircuit, "https://xedruo-elinit-ai.onrender.com"],
  ["Xedruo Music Distribution", "Release and distribute music", Music2, "https://xedruo-music-distribution.onrender.com"]
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Logo />
        <a href="/worker-access" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:border-cyan-300/30 hover:text-white">Manage Company</a>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-5 pb-12 pt-12 md:pt-16">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[.35em] text-cyan-300">Xedruo Group Holdings</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">One parent company. <span className="text-cyan-300">14 companies.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">The parent company is the central entry point. Customers enter each company through its own landing page, while authorized Xedruo personnel can manage company access from the parent workspace.</p>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[.025] px-5 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-end justify-between">
              <div><div className="text-xs uppercase tracking-[.3em] text-slate-500">Parent company access</div><h2 className="mt-1 text-2xl font-bold md:text-3xl">Unlock company access</h2></div>
              <span className="text-sm text-slate-500">14 companies</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {companies.map(([name, description, Icon, url]) => (
                <a key={name} href={url} className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[.08]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300"><Icon size={22} /></div>
                  <h3 className="mt-4 font-semibold">{name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-5 text-slate-500">{description}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-300">Open company landing page <ArrowRight size={14} className="transition group-hover:translate-x-1" /></div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-7 md:p-10">
            <div className="text-xs uppercase tracking-[.3em] text-slate-500">Manage Company</div>
            <h2 className="mt-2 text-2xl font-bold">Parent-company management workspace</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Developer, CTO, Governor, Accountant, Customer Service and HR roles are managed from the parent company workspace.</p>
            <a href="/worker-access" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950">Unlock Manage Company <ArrowRight size={16} /></a>
          </div>
        </section>
      </main>
    </div>
  );
}
