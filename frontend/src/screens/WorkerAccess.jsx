import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Calculator, Code2, Headphones, Users, DollarSign, BriefcaseBusiness, Building2, ArrowLeft } from "lucide-react";

const roles = [
  {id:"developer",name:"Developer",desc:"Build, edit, integrate and deploy apps",Icon:Code2,dashboard:"Developer Dashboard",route:"/developer-workstation"},
  {id:"accountant",name:"Accountant",desc:"Sales, income, expenses and transactions",Icon:Calculator,dashboard:"Finance & Sales Dashboard",route:"/accountant"},
  {id:"customer_service",name:"Customer Service",desc:"Customer queries and replies",Icon:Headphones,dashboard:"Customer Service Dashboard",route:"/customer-service",requiresCompany:true},
  {id:"hr",name:"HR",desc:"Staff registration and workforce",Icon:Users,dashboard:"HR Workforce Dashboard",route:"/hr",requiresCompany:true},
  {id:"governor_operations",name:"Governor",desc:"Company-wide operations and performance",Icon:BarChart3,dashboard:"Governor Performance Dashboard",route:"/governor"},
  {id:"governor_finance",name:"CFO",desc:"Executive finance and growth",Icon:DollarSign,dashboard:"CFO Dashboard",route:"/governor-finance"}
];

const companies = [
  {slug:"xedruo-power-holdings",name:"Xedruo Power Holdings"},
  ...Array.from({length:12},(_,i)=>({slug:`power-holdings-company-${i+2}`,name:`Power Holdings Company ${i+2}`}))
];
const DEFAULT_COMPANY = companies[0].slug;

export default function WorkerAccess(){
  const navigate = useNavigate();
  const [companyStep, setCompanyStep] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(localStorage.getItem("xedruo_selected_company") || DEFAULT_COMPANY);

  function openFunction(role){
    if(role.requiresCompany){
      setCompanyStep(role);
      return;
    }
    openWorkstation(role, localStorage.getItem("xedruo_selected_company") || DEFAULT_COMPANY);
  }

  function openWorkstation(role, company){
    localStorage.setItem("xedruo_selected_company", company);
    localStorage.setItem("xedruo_workforce_context", JSON.stringify({company_slug:company, role:role.id, selected_at:new Date().toISOString()}));
    navigate(`${role.route}?company=${encodeURIComponent(company)}`);
  }

  function confirmCompany(){
    if(!companyStep || !selectedCompany) return;
    openWorkstation(companyStep, selectedCompany);
  }

  if(companyStep){
    return <div className="min-h-screen bg-slate-950 text-white p-5 md:p-10"><div className="mx-auto max-w-3xl">
      <button onClick={()=>setCompanyStep(null)} className="mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16}/> Back to functions</button>
      <div className="rounded-3xl border border-cyan-300/20 bg-white/5 p-6 md:p-8">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-300/10 p-3"><Building2 className="text-cyan-300" size={24}/></div><div><div className="text-xs uppercase tracking-[.3em] text-cyan-300">{companyStep.name}</div><h1 className="mt-1 text-3xl font-bold">Select company</h1></div></div>
        <p className="mt-4 text-slate-400">Choose the company you will work on before opening the {companyStep.name} workstation.</p>
        <label className="mt-7 block text-sm font-medium text-slate-300">Company</label>
        <select value={selectedCompany} onChange={e=>setSelectedCompany(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 p-4 text-white outline-none focus:border-cyan-300/50">
          {companies.map(company=><option key={company.slug} value={company.slug}>{company.name}</option>)}
        </select>
        <button onClick={confirmCompany} className="mt-5 w-full rounded-2xl bg-cyan-300 px-5 py-4 font-semibold text-slate-950">Continue to {companyStep.name} workstation →</button>
      </div>
    </div></div>;
  }

  return <div className="min-h-screen bg-slate-950 text-white p-5 md:p-10"><div className="mx-auto max-w-5xl"><div className="mb-8"><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Xedruo workforce access</div><h1 className="mt-2 text-4xl font-bold">Select your function</h1><p className="mt-3 text-slate-400">Choose a function and its workstation dashboard opens immediately. Customer Service and HR require a company selection first.</p></div><div className="rounded-3xl border border-white/10 bg-white/5 p-6"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{roles.map(({id,name,desc,Icon,dashboard,route,requiresCompany})=><button key={id} onClick={()=>openFunction({id,name,route,requiresCompany})} className="rounded-2xl border border-white/10 bg-black/20 p-5 text-left transition hover:border-cyan-300/40 hover:bg-cyan-300/10"><Icon className="mb-3 text-cyan-300" size={22}/><div className="font-semibold text-lg">{name}</div><div className="mt-1 text-xs text-slate-500">{desc}</div><div className="mt-4 flex items-center gap-2 text-xs text-cyan-300"><BriefcaseBusiness size={14}/> {dashboard}</div></button>)}</div></div><p className="mt-4 text-center text-xs text-slate-600">Company-sensitive data remains subject to server-side authorization.</p></div></div>;
}
