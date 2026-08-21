import React from "react";
import { ArrowRight, BrainCircuit, GraduationCap, HeartPulse, Music2, Rocket, ShoppingCart, Sprout, Trophy, Truck, Users, Wallet } from "lucide-react";
import Logo from "@/components/marketing/Logo";

const publicServices = [
  ["Pay & Play", "Payments, wallet, music, tickets and artist services", Wallet, "https://xedruo-pay-and-play.onrender.com"],
  ["Sportruo", "Sports, talent, competitions and sports experiences", Trophy, "https://xedruo-sportruo.onrender.com"],
  ["Hireruo", "Find work, hire people and manage workforce needs", Users, "https://xedruo-hireruo.onrender.com"],
  ["Adom", "Shop for products and request everyday services", ShoppingCart, "https://xedruo-adom.onrender.com"],
  ["Agruo", "Agriculture products, services and opportunities", Sprout, "https://xedruo-agruo.onrender.com"],
  ["Healthruo", "Healthcare and health-related services", HeartPulse, "https://xedruo-healthruo.onrender.com"],
  ["Xedruo Education", "Learning, schools and academic services", GraduationCap, "https://xedruo-education.onrender.com"],
  ["Xedruo Logistics", "Move goods and access logistics services", Truck, "https://xedruo-logistics.onrender.com"],
  ["Xedruo Music Distribution", "Release and distribute music", Music2, "https://xedruo-music-distribution.onrender.com"],
  ["ELinit AI", "AI assistance for public users and Xedruo developers", BrainCircuit, "https://xedruo-elinit-ai.onrender.com"],
  ["Spacetruo", "Technology, aviation, marine, automotive and space", Rocket, "https://xedruo-spacetruo.onrender.com"]
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Logo />
        <a href="/worker-access" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:border-cyan-300/30 hover:text-white">
          Staff & Manager Access
        </a>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-5 pb-14 pt-14 md:pt-20">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[.35em] text-cyan-300">Xedruo</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Use the Xedruo service you need.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
              Xedruo connects different services under one group. Customers use each company through its own customer-facing experience. This page is for discovering and entering those services — not for managing companies.
            </p>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[.025] px-5 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[.3em] text-slate-500">Customer services</div>
              <h2 className="mt-1 text-2xl font-bold md:text-3xl">What would you like to do?</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {publicServices.map(([name, description, Icon, url]) => (
                <a key={name} href={url} className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-white/[.08]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300"><Icon size={22} /></div>
                  <h3 className="mt-4 font-semibold">{name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-5 text-slate-500">{description}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-cyan-300">Enter service <ArrowRight size={14} className="transition group-hover:translate-x-1" /></div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-7 md:p-10">
            <div className="text-xs uppercase tracking-[.3em] text-slate-500">For Xedruo personnel</div>
            <h2 className="mt-2 text-2xl font-bold">Staff and managers have a separate workspace.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Company administration, staff operations, developer workstations, finance and management controls are kept out of the customer experience.</p>
            <a href="/worker-access" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950">Open Staff & Manager Access <ArrowRight size={16} /></a>
          </div>
        </section>
      </main>
    </div>
  );
}
