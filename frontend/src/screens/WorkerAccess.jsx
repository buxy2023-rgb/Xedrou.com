import React from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Calculator, Code2, Headphones, Users, DollarSign, BriefcaseBusiness } from "lucide-react";

const roles = [
  {id:"developer",name:"Developer",desc:"Build, edit, integrate and deploy apps",Icon:Code2,dashboard:"Developer Dashboard",route:"/developer-workstation"},
  {id:"accountant",name:"Accountant",desc:"Sales, income, expenses and transactions",Icon:Calculator,dashboard:"Finance & Sales Dashboard",route:"/accountant"},
  {id:"customer_service",name:"Customer Service",desc:"Customer queries and replies",Icon:Headphones,dashboard:"Customer Service Dashboard",route:"/customer-service"},
  {id:"hr",name:"HR",desc:"Staff registration and workforce",Icon:Users,dashboard:"HR Workforce Dashboard",route:"/hr"},
  {id:"governor_operations",name:"Governor",desc:"Company-wide operations and performance",Icon:BarChart3,dashboard:"Governor Performance Dashboard",route:"/governor"},
  {id:"governor_finance",name:"CFO",desc:"Executive finance and growth",Icon:DollarSign,dashboard:"CFO Dashboard",route:"/governor-finance"}
];

const DEFAULT_COMPANY = "xedruo-power-holdings";

export default function WorkerAccess(){
  const navigate = useNavigate();

  function openFunction(role){
    const company = localStorage.getItem("xedruo_selected_company") || DEFAULT_COMPANY;
    localStorage.setItem("xedruo_workforce_context", JSON.stringify({company_slug:company, role, selected_at:new Date().toISOString()}));
    navigate(`${role.route}?company=${encodeURIComponent(company)}`);
  }

  return <div className="min-h-screen bg-slate-950 text-white p-5 md:p-10">
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[.3em] text-cyan-300">Xedruo workforce access</div>
        <h1 className="mt-2 text-4xl font-bold">Select your function</h1>
        <p className="mt-3 text-slate-400">Choose a function and its workstation dashboard opens immediately. You can change the company from the top-right of the workstation.</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map(({id,name,desc,Icon,dashboard,route})=><button key={id} onClick={()=>openFunction({id,name,route})} className="rounded-2xl border border-white/10 bg-black/20 p-5 text-left transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
            <Icon className="mb-3 text-cyan-300" size={22}/>
            <div className="font-semibold text-lg">{name}</div>
            <div className="mt-1 text-xs text-slate-500">{desc}</div>
            <div className="mt-4 flex items-center gap-2 text-xs text-cyan-300"><BriefcaseBusiness size={14}/> {dashboard}</div>
          </button>)}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-600">Company-sensitive data remains subject to server-side authorization.</p>
    </div>
  </div>;
}
