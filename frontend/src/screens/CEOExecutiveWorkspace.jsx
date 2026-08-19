import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, BriefcaseBusiness, DollarSign, Sparkles, Users } from "lucide-react";

export default function CEOExecutiveWorkspace({ office=false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const ceoId = Number(id) || 1;
  const title = office ? `Office of the Executive — CEO ${ceoId}` : `CEO ${ceoId} Dashboard`;
  return (
    <div className="min-h-screen bg-slate-950 text-white p-5 md:p-8">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => navigate("/power-holdings")} className="mb-5 flex items-center gap-2 text-sm text-slate-400"><ArrowLeft size={16}/> Back to Power Holdings</button>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="text-xs uppercase tracking-[.3em] text-violet-300">Power Holdings Company 01 · CEO {ceoId}</div>
          <h1 className="mt-2 text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-slate-400">{office ? "Executive coordination, approvals, meetings, directives and action tracking for this CEO." : "Executive performance view for this CEO's company operations, finance, sales and workforce."}</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(office ? [["Executive agenda","12",BriefcaseBusiness],["Pending approvals","4",Users],["Directives","8",BarChart3],["AI priorities","5",Sparkles]] : [["Sales","₦4.86m",BarChart3],["Income","₦3.97m",DollarSign],["Expenses","₦2.31m",BarChart3],["Operations","94%",Sparkles]]).map(([label,value,Icon]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-5"><Icon size={18} className="text-cyan-300"/><div className="mt-3 text-2xl font-bold">{value}</div><div className="mt-1 text-xs text-slate-500">{label}</div></div>)}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-black/20 p-5"><h2 className="font-semibold">{office ? "Executive office workflow" : "CEO priorities"}</h2><ul className="mt-4 space-y-3 text-sm text-slate-400"><li>• Review weekly performance and exceptions</li><li>• Assign owners and deadlines to critical actions</li><li>• Monitor finance, sales, expenses and operations</li><li>• Escalate company risks and opportunities</li></ul></section>
            <section className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 p-5"><div className="flex items-center gap-2"><Sparkles className="text-cyan-300" size={18}/><h2 className="font-semibold">Xedruo AI Executive Assistant</h2></div><p className="mt-3 text-sm leading-6 text-slate-400">Generate an executive brief, identify performance gaps, recommend growth actions and prepare the next leadership agenda.</p><button className="mt-4 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">Generate executive brief</button></section>
          </div>
        </div>
      </div>
    </div>
  );
}
