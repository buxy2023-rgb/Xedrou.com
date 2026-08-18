import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";

const companies = [
  { slug: "xedruo-power-holdings", name: "Xedruo Power Holdings", type: "Parent / Holding Company", valuation: "$150B–$800B" },
  { slug: "xedruo", name: "Xedruo", type: "Pay & Play, AI, Distribution", valuation: "$100B–$500B+" },
  { slug: "sportruo", name: "Sportruo", type: "Sports", valuation: "$10B–$50B" },
  { slug: "hireruo", name: "Hireruo", type: "Hiring & Workforce", valuation: "$10B–$50B" },
  { slug: "adom", name: "Adom", type: "Consumer / Community", valuation: "$20B–$100B" },
  { slug: "agruo", name: "Agruo", type: "Agriculture", valuation: "$20B–$100B" },
  { slug: "heathrou", name: "Heathrou", type: "Health", valuation: "$30B–$150B" },
  { slug: "xedruo-education", name: "Xedruo Education", type: "Education", valuation: "$20B–$100B" },
  { slug: "xedruo-capital", name: "Xedruo Capital", type: "Finance & Investment", valuation: "$50B–$300B" },
  { slug: "xedruo-energy", name: "Xedruo Energy", type: "Energy", valuation: "$100B–$500B" },
  { slug: "xedruo-logistics", name: "Xedruo Logistics", type: "Logistics", valuation: "$20B–$150B" },
  { slug: "xedruo-properties", name: "Xedruo Properties", type: "Real Estate", valuation: "$20B–$100B" },
  { slug: "spacetruo", name: "Spacetruo", type: "Space & Aerospace", valuation: "$100B–$1T" },
  { slug: "xedruo-ai", name: "Xedruo AI", type: "Artificial Intelligence", valuation: "$100B–$1T" },
];

export default function CompanyAI() {
  const [selected, setSelected] = useState(companies[0]);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([{ role: "assistant", content: "Xedruo Company AI is online. Select a company and tell me what you want built, analyzed, planned or managed." }]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setMessages([{ role: "assistant", content: `Loading private memory for ${selected.name}…` }]);
    base44.companyAI.memory(selected.slug).then(({ messages: saved = [] }) => {
      if (!active) return;
      setMessages(saved.length ? saved.map((m) => ({ role: m.role, content: m.content })) : [{ role: "assistant", content: `Xedruo Company AI is ready for ${selected.name}.` }]);
    }).catch(() => {
      if (active) setMessages([{ role: "assistant", content: `Xedruo Company AI is ready for ${selected.name}.` }]);
    });
    return () => { active = false; };
  }, [selected]);

  const suggested = useMemo(() => selected.slug === "xedruo-power-holdings"
    ? ["Build the 14-company group strategy for the next 5 years.", "Design the operating model for the holding company.", "Create a capital allocation framework across all subsidiaries."]
    : [`Create a 90-day launch plan for ${selected.name}.`, `Design the AI and technology architecture for ${selected.name}.`, `Identify the biggest revenue opportunities for ${selected.name}.`], [selected]);

  async function sendMessage(text = prompt) {
    const clean = text.trim();
    if (!clean || busy) return;
    setMessages((current) => [...current, { role: "user", content: clean }]);
    setPrompt(""); setBusy(true);
    try {
      const result = await base44.companyAI.chat({ company: selected.slug, companyType: selected.type, userMessage: clean });
      setMessages((current) => [...current, { role: "assistant", content: result.answer || "I could not produce an answer." }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", content: `AI request failed: ${error.message}` }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div><div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Private Company Intelligence</div><h1 className="mt-2 text-3xl font-bold md:text-5xl">Xedruo Company AI</h1><p className="mt-2 max-w-3xl text-slate-400">One personal AI command center for Xedruo Power Holdings and all 13 operating companies.</p></div>
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-100">14-company group • Supabase memory • Private AI</div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-4"><h2 className="mb-3 text-sm font-semibold text-slate-300">Company command</h2><div className="space-y-2">
            {companies.map((company) => <button key={company.slug} onClick={() => setSelected(company)} className={`w-full rounded-2xl p-3 text-left transition ${selected.slug === company.slug ? "bg-cyan-400/15 ring-1 ring-cyan-300/40" : "hover:bg-white/5"}`}><div className="font-medium">{company.name}</div><div className="mt-1 text-xs text-slate-500">{company.type}</div><div className="mt-1 text-xs text-cyan-200/70">{company.valuation}</div></button>)}
          </div></aside>
          <main className="flex min-h-[720px] flex-col rounded-3xl border border-white/10 bg-white/[0.035]">
            <div className="border-b border-white/10 p-5"><div className="text-xs uppercase tracking-widest text-slate-500">Active workspace</div><div className="mt-1 flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold">{selected.name}</h2><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">{selected.type}</span></div></div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">{messages.map((message, index) => <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-200"}`}>{message.content}</div></div>)}{busy && <div className="text-sm text-slate-500">Xedruo Company AI is thinking…</div>}</div>
            <div className="border-t border-white/10 p-5"><div className="mb-3 flex flex-wrap gap-2">{suggested.map((item) => <button key={item} onClick={() => sendMessage(item)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">{item}</button>)}</div><div className="flex gap-2"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={`Ask the AI about ${selected.name}…`} className="min-h-14 flex-1 resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-sm outline-none focus:border-cyan-300/50" /><button disabled={busy || !prompt.trim()} onClick={() => sendMessage()} className="self-end rounded-2xl bg-cyan-300 px-5 py-4 font-semibold text-slate-950 disabled:opacity-40">Send</button></div></div>
          </main>
        </div>
      </div>
    </div>
  );
}
