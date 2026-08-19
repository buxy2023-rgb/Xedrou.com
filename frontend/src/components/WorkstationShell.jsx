import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import CompanySwitcher from "./CompanySwitcher";

export default function WorkstationShell(){
  const location=useLocation();
  const navigate=useNavigate();
  const company=new URLSearchParams(location.search).get("company") || localStorage.getItem("xedruo_selected_company") || "xedruo-power-holdings";
  function changeCompany(next){
    localStorage.setItem("xedruo_selected_company",next);
    const params=new URLSearchParams(location.search); params.set("company",next);
    navigate(`${location.pathname}?${params.toString()}`);
  }
  return <div className="min-h-screen bg-slate-950 text-white">
    <div className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur px-4 md:px-6 py-3 flex items-center justify-between gap-3">
      <div className="text-xs uppercase tracking-[.25em] text-slate-500">Xedruo workstation</div>
      <CompanySwitcher value={company} onChange={changeCompany}/>
    </div>
    <Outlet />
  </div>;
}
