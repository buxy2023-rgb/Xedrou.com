import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, BriefcaseBusiness, Building2, Crown, DollarSign, HardDrive, Users } from "lucide-react";

const ceos = Array.from({ length: 13 }, (_, i) => ({ id: i + 1, name: `CEO ${i + 1}`, company: `Power Holdings Company ${i + 1}` }));

export default function PowerHoldingsExecutive() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-white p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-cyan-300/20 bg-white/5 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="text-xs uppercase tracking-[.3em] text-cyan-300">Company 01 · Xedruo Power Holdings</div>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold">Power Holdings Executive Command Center</h1>
              <p className="mt-3 max-w-3xl text-slate-400">Central executive layer for company performance, finance, the thirteen CEOs and each CEO's Office of the Executive.</p>
            </div>
            <button onClick={() => navigate("/worker-access")} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">Change company/function</button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <button onClick={() => navigate("/governor?company=xedruo-power-holdings")} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-left hover:bg-cyan-300/15">
              <BarChart3 className="text-cyan-300" />
              <h2 className="mt-3 text-xl font-bold">Governor Dashboard</h2>
              <p className="mt-2 text-sm text-slate-400">Weekly, monthly and yearly aggregate operations, sales, finance, expenses and AI growth analysis.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-cyan-300">Open dashboard <ArrowRight size={16} /></span>
            </button>
            <button onClick={() => navigate("/governor-finance?company=xedruo-power-holdings&role=cfo")} className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5 text-left hover:bg-emerald-300/15">
              <DollarSign className="text-emerald-300" />
              <h2 className="mt-3 text-xl font-bold">CFO Dashboard</h2>
              <p className="mt-2 text-sm text-slate-400">Finance control view for sales, income, expenses, failed transactions, cash performance and profitable growth.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-300">Open CFO dashboard <ArrowRight size={16} /></span>
            </button>
            <button onClick={() => navigate("/platform-usage")} className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-5 text-left hover:bg-violet-300/15">
              <HardDrive className="text-violet-300" />
              <h2 className="mt-3 text-xl font-bold">Users & Storage</h2>
              <p className="mt-2 text-sm text-slate-400">Monitor total users, active users, new registrations, files and storage capacity.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm text-violet-300">Open monitoring <ArrowRight size={16} /></span>
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3"><Users className="text-violet-300" /><div><h2 className="text-2xl font-bold">13 CEO Dashboards</h2><p className="text-sm text-slate-500">Each CEO has an independent dashboard and an Office of the Executive.</p></div></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ceos.map((ceo) => (
              <div key={ceo.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between"><div className="rounded-xl bg-violet-300/10 p-2"><Crown className="text-violet-300" size={18} /></div><span className="text-xs text-slate-500">#{String(ceo.id).padStart(2, "0")}</span></div>
                <h3 className="mt-4 font-bold">{ceo.name}</h3><p className="mt-1 text-xs text-slate-500">{ceo.company}</p>
                <div className="mt-4 grid gap-2">
                  <button onClick={() => navigate(`/ceo/${ceo.id}?company=xedruo-power-holdings`)} className="rounded-xl bg-violet-300 p-2.5 text-sm font-semibold text-slate-950">CEO Dashboard</button>
                  <button onClick={() => navigate(`/ceo/${ceo.id}/office?company=xedruo-power-holdings`)} className="rounded-xl border border-white/10 p-2.5 text-sm text-slate-300 flex items-center justify-center gap-2"><BriefcaseBusiness size={15} /> Office of the Executive</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center gap-3 text-sm text-slate-400"><Building2 className="text-cyan-300" size={18} /> Company 01 remains the parent executive layer; CEO workspaces are separated below it.</div>
      </div>
    </div>
  );
}
