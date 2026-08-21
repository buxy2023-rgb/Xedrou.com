import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Code2, ExternalLink, FileUp, FolderOpen, Globe2, Image as ImageIcon, Link2, Loader2, MessageSquare, PackagePlus, Play, Plus, Rocket, Send, ShieldCheck, Terminal, Upload, XCircle } from "lucide-react";
import { developerClient } from "../lib/developerClient";

const STORAGE_URL = "https://hbfgovldrodjkdmyxuvu.supabase.co";
const STORAGE_KEY = "sb_publishable_cTkEa_COXH8yWO_L_zvJsw_TVNyKDNT";
const BUCKET = "xedruo-project-files";
const headers = (extra = {}) => ({ apikey: STORAGE_KEY, Authorization: `Bearer ${STORAGE_KEY}`, ...extra });

async function listProjectFiles(projectId) {
  const res = await fetch(`${STORAGE_URL}/storage/v1/object/list/${BUCKET}`, { method: "POST", headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify({ prefix: `projects/${projectId}/`, limit: 1000, offset: 0, sortBy: { column: "created_at", order: "desc" } }) });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).filter(x => x.name).map(x => ({ id: x.id || x.name, name: x.name, path: `projects/${projectId}/${x.name}`, type: x.metadata?.mimetype || "application/octet-stream", size: x.metadata?.size || 0, url: `${STORAGE_URL}/storage/v1/object/public/${BUCKET}/projects/${encodeURIComponent(projectId)}/${encodeURIComponent(x.name)}` }));
}
async function uploadProjectFiles(projectId, incoming) {
  const results = [];
  for (const file of incoming) {
    const path = `projects/${projectId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const res = await fetch(`${STORAGE_URL}/storage/v1/object/${BUCKET}/${path}`, { method: "POST", headers: headers({ "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" }), body: file });
    if (!res.ok) throw new Error(await res.text());
    results.push({ id: path, name: file.name, path, type: file.type || "application/octet-stream", size: file.size, url: `${STORAGE_URL}/storage/v1/object/public/${BUCKET}/${path}` });
  }
  return results;
}

const stepLabels = ["Understand request", "Inspect project", "Plan implementation", "Review changes", "Execute approved work", "Build & test", "Preview", "Deploy"];

export default function DeveloperWorkstation() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [plan, setPlan] = useState(null);
  const [workflow, setWorkflow] = useState([]);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewConfigured, setPreviewConfigured] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [activeTool, setActiveTool] = useState("");

  const projectId = project?.id;
  const currentFiles = useMemo(() => files, [files]);

  useEffect(() => {
    let cancelled = false;
    developerClient.listProjects().then(data => {
      if (cancelled) return;
      setProjects(data.projects || []);
      setProfile(data.profile || null);
      const assigned = (data.projects || [])[0];
      if (assigned) {
        setProject(assigned);
        setChat([{ role: "assistant", text: `Your developer workstation is ready for ${assigned.name}. Describe the change and I will analyze the project, show the engineering workflow, and prepare an executable plan for your approval.` }]);
      }
    }).catch(err => !cancelled && setError(err.message)).finally(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    listProjectFiles(projectId).then(rows => !cancelled && setFiles(rows)).catch(err => !cancelled && setError(`Project storage: ${err.message}`));
    developerClient.getPreview(projectId).then(data => { if (!cancelled) { setPreviewUrl(data.previewUrl || ""); setPreviewConfigured(!!data.isConfigured); } }).catch(() => {});
    return () => { cancelled = true; };
  }, [projectId]);

  function setSteps(statuses) { setWorkflow(stepLabels.map((label, i) => ({ label, status: statuses?.[i] || "pending" }))); }

  async function sendChat() {
    const prompt = message.trim();
    if (!prompt || !project || busy) return;
    setMessage(""); setError(""); setPlan(null); setBusy(true);
    setChat(c => [...c, { role: "user", text: prompt }]);
    setSteps(["done", "running", "pending", "pending", "pending", "pending", "pending", "pending"]);
    try {
      const result = await developerClient.promptProject(project.id, prompt);
      setSteps(["done", "done", "done", "running", "pending", "pending", "pending", "pending"]);
      setPlan(result.plan);
      setChat(c => [...c, { role: "assistant", text: result.plan?.summary || "I inspected the project and prepared the implementation plan below. Review it before execution." }]);
    } catch (err) {
      setSteps(["done", "failed", "failed", "pending", "pending", "pending", "pending", "pending"]);
      setError(err.message); setChat(c => [...c, { role: "assistant", text: `I could not complete the engineering analysis: ${err.message}` }]);
    } finally { setBusy(false); }
  }

  async function executePlan() {
    if (!plan || !project || busy) return;
    setBusy(true); setError(""); setActiveTool("Execution engine");
    setSteps(["done", "done", "done", "done", "running", "pending", "pending", "pending"]);
    try {
      const result = await developerClient.executePlan(project.id, message || plan.summary || "Developer requested project changes", plan);
      const failed = (result.results || []).filter(r => r.status === "failed");
      setSteps(["done", "done", "done", "done", failed.length ? "failed" : "done", failed.length ? "failed" : "running", "pending", "pending"]);
      setChat(c => [...c, { role: "assistant", text: failed.length ? `Execution completed with ${failed.length} failed tool action${failed.length === 1 ? "" : "s"}. Review the execution log below.` : "Approved engineering work has been executed successfully. The project build/preview stage is next." }]);
      setPlan({ ...plan, execution: result.results || [] });
      if (!failed.length) {
        setSteps(["done", "done", "done", "done", "done", "done", "running", "pending"]);
        const p = await developerClient.getPreview(project.id);
        setPreviewUrl(p.previewUrl || ""); setPreviewConfigured(!!p.isConfigured);
        setSteps(["done", "done", "done", "done", "done", "done", "done", "pending"]);
      }
    } catch (err) { setSteps(["done", "done", "done", "done", "failed", "failed", "pending", "pending"]); setError(err.message); }
    finally { setBusy(false); setActiveTool(""); }
  }

  async function openPreview() {
    if (!project) return;
    try { const data = await developerClient.getPreview(project.id); setPreviewUrl(data.previewUrl || ""); setPreviewConfigured(!!data.isConfigured); if (data.previewUrl) window.open(data.previewUrl, "_blank", "noopener,noreferrer"); } catch (err) { setError(err.message); }
  }

  async function handleFiles(e) {
    const incoming = Array.from(e.target.files || []); if (!incoming.length || !project) return;
    setUploading(true); setError("");
    try { const uploaded = await uploadProjectFiles(project.id, incoming); setFiles(f => [...uploaded, ...f]); setChat(c => [...c, { role: "assistant", text: `Uploaded ${uploaded.length} project file${uploaded.length === 1 ? "" : "s"}. They are now available to the workstation.` }]); }
    catch (err) { setError(`Upload failed: ${err.message}`); } finally { setUploading(false); e.target.value = ""; }
  }

  if (error && !project) return <div className="min-h-screen bg-slate-950 text-white grid place-items-center p-6"><div className="max-w-lg rounded-2xl border border-red-400/20 bg-red-400/5 p-6"><h1 className="text-xl font-bold">Developer workstation unavailable</h1><p className="text-sm text-red-200 mt-2">{error}</p><button onClick={() => navigate("/worker-access")} className="mt-5 rounded-xl bg-white/10 px-4 py-2">Return to Manage Company</button></div></div>;

  return <div className="min-h-screen bg-slate-950 text-white flex flex-col">
    <header className="border-b border-white/10 bg-slate-950/95 sticky top-0 z-20"><div className="px-5 py-4 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-cyan-300/15 grid place-items-center"><Code2 className="text-cyan-300" /></div><div><div className="font-bold">Xedruo Developer Workstation</div><div className="text-xs text-slate-500">Private engineering workspace · ELinit assists underneath</div></div></div><div className="flex items-center gap-3"><div className="hidden sm:block text-right"><div className="text-xs text-slate-500">Developer</div><div className="text-sm font-medium">{profile?.full_name || profile?.email || "Authenticated developer"}</div></div><ShieldCheck size={20} className="text-emerald-300" /></div></div></header>
    <div className="flex flex-1 min-h-0"><aside className="w-72 hidden lg:block border-r border-white/10 p-4 overflow-y-auto"><div className="text-xs uppercase tracking-widest text-slate-500 px-2 pb-2">Your workspace</div><div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4 mb-4"><div className="text-xs text-cyan-300">Assigned company</div><div className="font-semibold mt-1">{project?.companies?.name || project?.name || "Loading…"}</div><div className="text-xs text-slate-500 mt-1">{project?.slug || ""}</div></div>{[["Project", FolderOpen], ["Code & changes", Code2], ["Integrations", PackagePlus], ["Domains", Globe2], ["APIs", Link2]].map(([label, Icon], i) => <div key={label} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${i === 0 ? "bg-white/10 text-white" : "text-slate-400"}`}><Icon size={18} />{label}</div>)}<div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-xs uppercase tracking-widest text-slate-500">Access boundary</div><div className="flex items-center gap-2 mt-3 text-sm text-emerald-300"><ShieldCheck size={16} /> Company locked</div><p className="text-xs text-slate-500 mt-2">ELinit can assist this workstation only within the authorized project scope.</p></div></aside>
      <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto"><div className="max-w-7xl mx-auto"><div className="flex flex-wrap items-center justify-between gap-4 mb-5"><div><div className="text-xs uppercase tracking-widest text-cyan-300">Assigned project</div><h1 className="text-2xl md:text-3xl font-bold mt-1">{project?.name || "Loading project…"}</h1><p className="text-sm text-slate-500">{project?.project_type || "Company application"} · {project?.status || "active"}</p></div><button onClick={openPreview} disabled={!project || busy} className="rounded-xl bg-cyan-300 text-slate-950 px-4 py-2.5 font-semibold flex items-center gap-2 disabled:opacity-50"><ExternalLink size={17} /> Preview project</button></div>
        <div className="grid xl:grid-cols-[1.35fr_.95fr] gap-5"><section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"><div className="px-5 py-4 border-b border-white/10 flex items-center justify-between"><div className="flex items-center gap-2"><MessageSquare size={18} className="text-cyan-300" /><span className="font-semibold">Developer command center</span></div><span className="text-xs text-slate-500">Describe what you want changed</span></div><div className="h-[330px] overflow-y-auto p-5 space-y-4">{chat.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role === "user" ? "bg-cyan-300 text-slate-950" : "bg-black/30 text-slate-300 border border-white/10"}`}>{m.text}</div></div>)}</div><div className="p-4 border-t border-white/10"><div className="flex gap-2 items-end"><button onClick={() => fileRef.current?.click()} className="w-11 h-11 rounded-xl border border-white/10 bg-black/20 grid place-items-center"><Plus size={20} /></button><input ref={fileRef} type="file" multiple accept="image/*,.pdf,.txt,.md,.json,.csv,.xlsx,.doc,.docx,.zip,.js,.jsx,.ts,.tsx,.css,.html,.svg" className="hidden" onChange={handleFiles} /><textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }} placeholder="Example: Optimize Sportruo as a complete sports ecosystem…" disabled={busy || !project} className="min-h-[46px] max-h-32 flex-1 rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm outline-none focus:border-cyan-300/40 disabled:opacity-50" /><button onClick={sendChat} disabled={busy || !project || !message.trim()} className="w-11 h-11 rounded-xl bg-cyan-300 text-slate-950 grid place-items-center disabled:opacity-40">{busy ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}</button></div><div className="mt-2 text-xs text-slate-600">{uploading ? "Uploading project files…" : "The workstation sends your request to the protected engineering layer; ELinit assists underneath."}</div></div></section>
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold flex items-center gap-2"><Terminal size={18} className="text-cyan-300" /> Developer workflow</h2><p className="text-xs text-slate-500 mt-1">Live execution trail for the current request</p></div>{activeTool && <span className="text-xs text-cyan-300">{activeTool}</span>}</div><div className="mt-5 space-y-2">{(workflow.length ? workflow : stepLabels.map(label => ({ label, status: "pending" }))).map((s, i) => <div key={s.label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${s.status === "running" ? "border-cyan-300/30 bg-cyan-300/5" : s.status === "done" ? "border-emerald-300/20 bg-emerald-300/5" : s.status === "failed" ? "border-red-300/20 bg-red-300/5" : "border-white/5"}`}><div className="w-6 h-6 rounded-full grid place-items-center">{s.status === "done" ? <CheckCircle2 size={17} className="text-emerald-300" /> : s.status === "failed" ? <XCircle size={17} className="text-red-300" /> : s.status === "running" ? <Loader2 size={17} className="text-cyan-300 animate-spin" /> : <span className="text-xs text-slate-600">{i + 1}</span>}</div><span className={`text-sm ${s.status === "pending" ? "text-slate-600" : "text-slate-200"}`}>{s.label}</span></div>)}</div></section></div>
        {error && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-300">{error}</div>}
        {plan && <section className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Implementation plan</h2><p className="text-xs text-slate-500 mt-1">Review the engineering work before execution.</p></div>{!plan.execution && <button onClick={executePlan} disabled={busy} className="rounded-xl bg-cyan-300 text-slate-950 px-4 py-2.5 font-semibold flex items-center gap-2 disabled:opacity-50"><Play size={16} /> Approve & execute</button>}</div><p className="text-sm text-slate-300 mt-4">{plan.summary}</p><div className="grid md:grid-cols-2 gap-3 mt-4">{(plan.implementation_steps || []).map((step, i) => <div key={i} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300"><span className="text-cyan-300 mr-2">{i + 1}.</span>{step}</div>)}</div>{(plan.files || []).length > 0 && <div className="mt-4 text-xs text-slate-500">ELinit prepared {plan.files.length} file change{plan.files.length === 1 ? "" : "s"}.</div>}{plan.execution && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4"><div className="text-sm font-semibold mb-2">Execution results</div>{plan.execution.map((r, i) => <div key={i} className="flex items-center gap-2 text-xs py-1"><span className={r.status === "succeeded" ? "text-emerald-300" : "text-red-300"}>{r.status}</span><span className="text-slate-400">{r.plugin}/{r.action}</span></div>)}</div>}</section>}
        <section className="mt-5 grid md:grid-cols-2 gap-5"><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold flex items-center gap-2"><Globe2 size={18} className="text-cyan-300" /> Live preview</h2><p className="text-xs text-slate-500 mt-1">Preview the project you are working on.</p></div><button onClick={openPreview} className="rounded-xl bg-white/10 px-3 py-2 text-sm">Open</button></div><div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm break-all">{previewUrl || "Preview URL is being resolved from the project configuration."}</div><div className="text-xs text-slate-600 mt-2">{previewConfigured ? "Configured project preview" : "Fallback preview route"}</div></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold flex items-center gap-2"><ImageIcon size={18} className="text-cyan-300" /> Project files</h2><p className="text-xs text-slate-500 mt-1">Screenshots, source files, logos and assets.</p></div><button onClick={() => fileRef.current?.click()} className="rounded-xl bg-white/10 px-3 py-2 text-sm flex items-center gap-2"><Upload size={15} /> Upload</button></div><div className="mt-4 space-y-2 max-h-36 overflow-y-auto">{currentFiles.length ? currentFiles.slice(0, 8).map(f => <div key={f.path} className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2 text-xs"><FileUp size={14} className="text-cyan-300" /><span className="truncate">{f.name}</span></div>) : <div className="text-xs text-slate-600">No project files uploaded yet.</div>}</div></div></section>
      </div></main></div>
  </div>;
}
