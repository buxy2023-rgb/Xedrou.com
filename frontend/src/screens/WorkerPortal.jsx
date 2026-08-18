import React, { useEffect, useMemo, useState } from "react";
import { companyPortal } from "@/lib/companyPortal";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Code2, Calculator, Headphones, BriefcaseBusiness, Save, CheckCircle2 } from "lucide-react";

const names = {
  "xedruo-power-holdings": "Xedruo Power Holdings", xedruo: "Xedruo", sportruo: "Sportruo", hireruo: "Hireruo", adom: "Adom", agruo: "Agruo", heathrou: "Heathrou", "xedruo-education": "Xedruo Education", "xedruo-capital": "Xedruo Capital", "xedruo-energy": "Xedruo Energy", "xedruo-logistics": "Xedruo Logistics", "xedruo-properties": "Xedruo Properties", spacetruo: "Spacetruo", "xedruo-ai": "Xedruo AI"
};

function Card({ children }) { return <div className="rounded-3xl border border-white/10 bg-white/5 p-5">{children}</div>; }

export default function WorkerPortal() {
  const { user } = useAuth();
  const [data, setData] = useState(null); const [pages, setPages] = useState([]); const [queries, setQueries] = useState([]); const [finance, setFinance] = useState(null); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const company = user?.company_slug; const role = user?.role;
  const canDev = role === "developer" || role === "admin"; const canAccount = role === "accountant" || role === "admin"; const canSupport = role === "customer_service" || role === "admin";

  useEffect(() => { companyPortal.context().then(setData).catch(e => setMessage(e.message)); }, []);
  useEffect(() => { if (!company) return; setBusy(true); Promise.all([canDev ? companyPortal.pages(company) : Promise.resolve({pages:[]}), canSupport ? companyPortal.queries(company) : Promise.resolve({queries:[]}), canAccount ? companyPortal.financials(company) : Promise.resolve(null)]).then(([p,q,f]) => { setPages(p.pages || []); setQueries(q.queries || []); setFinance(f); }).catch(e => setMessage(e.message)).finally(() => setBusy(false)); }, [company, canDev, canSupport, canAccount]);

  const [draft, setDraft] = useState({ slug: "home", title: "Home", content: { headline: "Welcome to Xedruo", body: "" }, published: false });
  const roleLabel = useMemo(() => ({developer:"Developer",accountant:"Accountant",customer_service:"Customer Service",staff:"Staff",admin:"Administrator"}[role] || "Staff"), [role]);

  async function savePage() { setBusy(true); try { const saved = await companyPortal.savePage({ ...draft, company }); setPages((p) => [saved, ...p.filter(x => x.slug !== saved.slug)]); setMessage("Site page saved."); } catch(e) { setMessage(e.message); } finally { setBusy(false); } }
  async function updateQuery(id,status) { try { const saved = await companyPortal.updateQuery(id,status); setQueries(q => q.map(x => x.id === id ? saved : x)); } catch(e) { setMessage(e.message); } }

  if (!user) return null;
  return <div className="min-h-screen bg-slate-950 text-white p-5 md:p-8"><div className="mx-auto max-w-7xl">
    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><div className="text-xs uppercase tracking-[.3em] text-cyan-300">Workforce command center</div><h1 className="mt-2 text-3xl font-bold">{names[company] || company || "Company"}</h1><p className="text-slate-400 mt-2">{roleLabel} portal • {user.email}</p></div><Link to="/company-ai" className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950">Open Company AI</Link></div>
    {message && <div className="mb-5 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm text-cyan-100">{message}</div>}
    {!company && <Card><h2 className="text-xl font-semibold">Your workforce profile is not assigned to a company yet.</h2><p className="mt-2 text-slate-400">Ask an administrator to assign your company and role before accessing internal systems.</p></Card>}
    {company && <div className="grid gap-5 md:grid-cols-3">
      <Card><div className="flex items-center gap-3"><BriefcaseBusiness/><div><div className="text-slate-400 text-sm">Company</div><div className="font-semibold">{names[company]}</div></div></div></Card>
      <Card><div className="flex items-center gap-3"><Code2/><div><div className="text-slate-400 text-sm">Role</div><div className="font-semibold">{roleLabel}</div></div></div></Card>
      <Card><div className="flex items-center gap-3"><CheckCircle2/><div><div className="text-slate-400 text-sm">Access</div><div className="font-semibold">{busy ? "Loading…" : "Active"}</div></div></div></Card>
    </div>}

    {canDev && <section className="mt-6"><h2 className="mb-3 text-xl font-semibold">Developer — Website backend</h2><div className="grid gap-5 lg:grid-cols-2"><Card><label className="text-sm text-slate-400">Page slug</label><input value={draft.slug} onChange={e=>setDraft({...draft,slug:e.target.value})} className="mt-1 w-full rounded-xl bg-black/30 p-3"/><label className="mt-3 block text-sm text-slate-400">Title</label><input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} className="mt-1 w-full rounded-xl bg-black/30 p-3"/><label className="mt-3 block text-sm text-slate-400">Headline</label><input value={draft.content.headline} onChange={e=>setDraft({...draft,content:{...draft.content,headline:e.target.value}})} className="mt-1 w-full rounded-xl bg-black/30 p-3"/><label className="mt-3 block text-sm text-slate-400">Page content</label><textarea value={draft.content.body} onChange={e=>setDraft({...draft,content:{...draft.content,body:e.target.value}})} className="mt-1 min-h-32 w-full rounded-xl bg-black/30 p-3"/><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.published} onChange={e=>setDraft({...draft,published:e.target.checked})}/> Published</label><button onClick={savePage} className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950"><Save size={16}/> Save website</button></Card><Card><h3 className="font-semibold">Existing pages</h3><div className="mt-3 space-y-2">{pages.map(p=><div key={p.id} className="rounded-xl bg-black/20 p-3"><div className="font-medium">{p.title}</div><div className="text-xs text-slate-500">/{p.slug} • {p.published ? "Published" : "Draft"}</div></div>)}{!pages.length && <div className="text-sm text-slate-500">No pages created yet.</div>}</div></Card></div></section>}

    {canAccount && <section className="mt-6"><h2 className="mb-3 text-xl font-semibold">Accountant — Income statement</h2><div className="grid gap-5 md:grid-cols-3"><Card><div className="text-sm text-slate-400">Income</div><div className="mt-2 text-3xl font-bold">{finance?.currency || "USD"} {Number(finance?.income || 0).toLocaleString()}</div></Card><Card><div className="text-sm text-slate-400">Expenses</div><div className="mt-2 text-3xl font-bold">{finance?.currency || "USD"} {Number(finance?.expenses || 0).toLocaleString()}</div></Card><Card><div className="text-sm text-slate-400">Net income</div><div className="mt-2 text-3xl font-bold">{finance?.currency || "USD"} {Number(finance?.net_income || 0).toLocaleString()}</div></Card></div><Card><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-white/10 text-slate-500"><th className="p-2">Date</th><th className="p-2">Account</th><th className="p-2">Description</th><th className="p-2">Income</th><th className="p-2">Expense</th></tr></thead><tbody>{(finance?.rows || []).map((r,i)=><tr key={i} className="border-b border-white/5"><td className="p-2">{r.entry_date}</td><td className="p-2">{r.account}</td><td className="p-2">{r.description}</td><td className="p-2">{r.income}</td><td className="p-2">{r.expense}</td></tr>)}</tbody></table></div></Card></section>}

    {canSupport && <section className="mt-6"><h2 className="mb-3 text-xl font-semibold">Customer Service — Queries</h2><div className="space-y-3">{queries.map(q=><Card key={q.id}><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="font-semibold">{q.subject}</div><div className="text-sm text-slate-400">{q.customer_name || "Customer"} • {q.customer_email || ""}</div><p className="mt-2 text-sm text-slate-300">{q.message}</p></div><select value={q.status} onChange={e=>updateQuery(q.id,e.target.value)} className="rounded-xl bg-black/30 p-2"><option>open</option><option>in_progress</option><option>resolved</option><option>closed</option></select></div></Card>)}{!queries.length && <Card><div className="flex items-center gap-2 text-slate-400"><Headphones size={18}/> No customer queries.</div></Card>}</div></section>}
  </div></div>;
}
