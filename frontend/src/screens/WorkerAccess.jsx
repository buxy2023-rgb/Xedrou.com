import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, BriefcaseBusiness, Calculator, Code2, Headphones, Users } from "lucide-react";

const companies = [
  ["xedruo-power-holdings","Xedruo Power Holdings"],["xedruo","Xedruo"],["sportruo","Sportruo"],["hireruo","Hireruo"],["adom","Adom"],["agruo","Agruo"],["heathrou","Heathrou"],["xedruo-education","Xedruo Education"],["xedruo-capital","Xedruo Capital"],["xedruo-energy","Xedruo Energy"],["xedruo-logistics","Xedruo Logistics"],["xedruo-properties","Xedruo Properties"],["spacetruo","Spacetruo"],["xedruo-ai","Xedruo AI"]
];
const roles = [
  ["developer","Developer — website & technology",Code2],
  ["accountant","Accountant — sales, income & transactions",Calculator],
  ["customer_service","Customer Service — customer queries",Headphones],
  ["hr","HR — staff registration & workforce",Users],
  ["governor_operations","Governor — operations & company performance",BarChart3],
  ["governor_finance","Governor — finance, sales & growth",BarChart3],
];

export default function WorkerAccess() {
  const [company,setCompany]=useState(""); const [role,setRole]=useState(""); const navigate=useNavigate();
  function continueToWorkstation(){
    if(!company||!role)return;
    localStorage.setItem("xedruo_workforce_context",JSON.stringify({company_slug:company,role,selected_at:new Date().toISOString()}));
    const routes={developer:"/developer",accountant:"/accountant",customer_service:"/customer-service",hr:"/hr",governor_operations:"/governor",governor_finance:"/governor-finance"};
    navigate(`${routes[role]}?company=${encodeURIComponent(company)}`);
  }
  return <div className="min-h-screen bg-slate-950 text-white p-5 md:p-10"><div className="mx-auto max-w-4xl"><div className="mb-8"><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Xedruo workforce access</div><h1 className="mt-2 text-4xl font-bold">Choose your company and work function</h1><p className="mt-3 text-slate-400">Select where you work and what you do. Xedruo will take you directly to the correct workstation.</p></div><div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6"><div><label className="text-sm text-slate-400">Company</label><select value={company} onChange={e=>setCompany(e.target.value)} className="mt-2 w-full rounded-2xl bg-black/30 p-4 border border-white/10"><option value="">Select company…</option>{companies.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></div><div><label className="text-sm text-slate-400">Your function</label><div className="mt-2 grid gap-3 sm:grid-cols-2">{roles.map(([v,n,Icon])=><button key={v} onClick={()=>setRole(v)} className={`rounded-2xl border p-4 text-left ${role===v?"border-cyan-300 bg-cyan-300/10":"border-white/10 bg-black/20"}`}><Icon className="mb-3 text-cyan-300" size={20}/><div className="font-medium">{n}</div></button>)}</div></div><button disabled={!company||!role} onClick={continueToWorkstation} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 p-4 font-semibold text-slate-950 disabled:opacity-40">Open my workstation <ArrowRight size={18}/></button></div><p className="mt-4 text-center text-xs text-slate-600">Company-sensitive backend data remains subject to server-side authorization.</p></div></div>;
}
