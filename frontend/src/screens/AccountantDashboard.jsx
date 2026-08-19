import React, { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, CircleDollarSign, Download, RefreshCw, TrendingDown, TrendingUp, XCircle } from "lucide-react";

const baseRows = [
  { month: "Jan", sales: 182000, income: 155000, expense: 91000, success: 420, failed: 18 },
  { month: "Feb", sales: 196000, income: 168000, expense: 97000, success: 448, failed: 15 },
  { month: "Mar", sales: 214000, income: 184000, expense: 103000, success: 476, failed: 13 },
  { month: "Apr", sales: 231000, income: 201000, expense: 108000, success: 509, failed: 11 },
  { month: "May", sales: 248000, income: 216000, expense: 112000, success: 541, failed: 9 },
  { month: "Jun", sales: 272000, income: 238000, expense: 119000, success: 588, failed: 8 },
  { month: "Jul", sales: 301000, income: 264000, expense: 126000, success: 632, failed: 7 },
];

const money = n => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

export default function AccountantDashboard() {
  const company = new URLSearchParams(window.location.search).get("company") || "selected company";
  const [period, setPeriod] = useState("monthly");
  const rows = useMemo(() => period === "weekly" ? baseRows.slice(-4) : period === "yearly" ? baseRows : baseRows, [period]);
  const totals = rows.reduce((a, r) => ({ sales: a.sales + r.sales, income: a.income + r.income, expense: a.expense + r.expense, success: a.success + r.success, failed: a.failed + r.failed }), { sales: 0, income: 0, expense: 0, success: 0, failed: 0 });
  const net = totals.income - totals.expense;
  const maxSales = Math.max(...rows.map(r => r.sales));

  return <div className="min-h-screen bg-slate-950 text-white p-5 md:p-8">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Accountant workstation</div><h1 className="mt-2 text-3xl font-bold">Sales & Finance Dashboard</h1><p className="mt-2 text-slate-400">{company} · income, expenses, sales and transaction health</p></div>
        <div className="flex gap-2"><button onClick={() => location.reload()} className="rounded-xl border border-white/10 px-4 py-2 text-sm flex items-center gap-2"><RefreshCw size={15}/> Refresh</button><button className="rounded-xl bg-cyan-300 text-slate-950 px-4 py-2 text-sm font-semibold flex items-center gap-2"><Download size={15}/> Export</button></div>
      </div>
      <div className="flex gap-2 mb-5">{["weekly","monthly","yearly"].map(x => <button key={x} onClick={() => setPeriod(x)} className={`rounded-full px-4 py-2 text-sm capitalize ${period===x ? "bg-cyan-300 text-slate-950 font-semibold" : "bg-white/5 text-slate-300"}`}>{x}</button>)}</div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[['Sales',money(totals.sales),BarChart3,'text-blue-300'],['Income',money(totals.income),CircleDollarSign,'text-emerald-300'],['Expenses',money(totals.expense),TrendingDown,'text-rose-300'],['Successful',totals.success,CheckCircle2,'text-green-300'],['Failed',totals.failed,XCircle,'text-red-300']].map(([label,value,Icon,cls]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon className={cls}/><div className="mt-4 text-2xl font-bold">{value}</div><div className="text-sm text-slate-500">{label}</div></div>)}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Sales performance</h2><p className="text-xs text-slate-500">Selected reporting period</p></div><TrendingUp className="text-cyan-300"/></div><div className="mt-7 flex items-end gap-3 h-64">{rows.map(r => <div key={r.month} className="flex-1 h-full flex flex-col justify-end"><div className="text-[10px] text-slate-500 text-center mb-1">{money(r.sales).replace('₦','₦').replace(/,000$/, 'k')}</div><div className="rounded-t-xl bg-cyan-300/70" style={{height:`${Math.max(8,(r.sales/maxSales)*82)}%`}}/><div className="text-xs text-slate-500 text-center mt-2">{r.month}</div></div>)}</div></div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6"><h2 className="font-semibold">Profit position</h2><div className="mt-7 text-4xl font-black text-emerald-300">{money(net)}</div><p className="mt-2 text-sm text-slate-400">Net income after recorded expenses.</p><div className="mt-8 space-y-4"><div><div className="flex justify-between text-xs"><span>Income</span><span>{money(totals.income)}</span></div><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-300" style={{width:"78%"}}/></div></div><div><div className="flex justify-between text-xs"><span>Expenses</span><span>{money(totals.expense)}</span></div><div className="mt-2 h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-rose-300" style={{width:"42%"}}/></div></div></div></div>
      </div>
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-6"><h2 className="font-semibold">Transaction health</h2><div className="mt-5 grid md:grid-cols-2 gap-4"><div className="rounded-xl bg-emerald-300/10 p-5"><div className="text-emerald-300 font-semibold">Successful transactions</div><div className="mt-2 text-3xl font-bold">{totals.success}</div><p className="text-xs text-slate-400 mt-1">Completed without reported failure.</p></div><div className="rounded-xl bg-red-300/10 p-5"><div className="text-red-300 font-semibold">Failed transactions</div><div className="mt-2 text-3xl font-bold">{totals.failed}</div><p className="text-xs text-slate-400 mt-1">Review payment, reconciliation and retry queues.</p></div></div></div>
    </div>
  </div>;
}
