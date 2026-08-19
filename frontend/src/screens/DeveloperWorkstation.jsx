import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Code2, ExternalLink, FileUp, FolderOpen, Globe2, Image as ImageIcon, Link2, MessageSquare, PackagePlus, Plus, Send, Trash2, Upload } from "lucide-react";
import CompanySwitcher, { XEDRUO_COMPANIES } from "../components/CompanySwitcher";

const tools = ["Base44", "Replit", "Lovable", "Heracle"];
const starterProjects = [
  { id: "power-holdings", name: "Power Holdings", type: "Company application", status: "Active", company: "xedruo-power-holdings" },
  { id: "xedruo", name: "Xedrou", type: "Platform", status: "Active", company: "xedruo" },
];

const STORAGE_URL = "https://hbfgovldrodjkdmyxuvu.supabase.co";
const STORAGE_KEY = "sb_publishable_cTkEa_COXH8yWO_L_zvJsw_TVNyKDNT";
const BUCKET = "xedruo-project-files";

function headers(extra = {}) { return { apikey: STORAGE_KEY, Authorization: `Bearer ${STORAGE_KEY}`, ...extra }; }

async function listProjectFiles(projectId) {
  const res = await fetch(`${STORAGE_URL}/storage/v1/object/list/${BUCKET}`, { method: "POST", headers: headers({ "Content-Type": "application/json" }), body: JSON.stringify({ prefix: `projects/${projectId}/`, limit: 1000, offset: 0, sortBy: { column: "created_at", order: "desc" } }) });
  if (!res.ok) throw new Error(await res.text());
  const rows = await res.json();
  return (rows || []).filter(x => x.name).map(x => ({ id: x.id || x.name, name: x.name, path: `projects/${projectId}/${x.name}`, type: x.metadata?.mimetype || "application/octet-stream", size: x.metadata?.size || 0, url: `${STORAGE_URL}/storage/v1/object/public/${BUCKET}/projects/${encodeURIComponent(projectId)}/${encodeURIComponent(x.name)}` }));
}

async function uploadProjectFiles(projectId, incoming) {
  const results = [];
  for (const file of incoming) {
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const path = `projects/${projectId}/${safeName}`;
    const res = await fetch(`${STORAGE_URL}/storage/v1/object/${BUCKET}/${path}`, { method: "POST", headers: headers({ "Content-Type": file.type || "application/octet-stream", "x-upsert": "true" }), body: file });
    if (!res.ok) throw new Error(await res.text());
    results.push({ id: safeName, name: file.name, path, type: file.type || "application/octet-stream", size: file.size, url: `${STORAGE_URL}/storage/v1/object/public/${BUCKET}/${path}` });
  }
  return results;
}

async function deleteProjectFile(path) {
  const res = await fetch(`${STORAGE_URL}/storage/v1/object/${BUCKET}/${path}`, { method: "DELETE", headers: headers() });
  if (!res.ok) throw new Error(await res.text());
}

export default function DeveloperWorkstation() {
  const navigate = useNavigate();
  const initialCompany = new URLSearchParams(window.location.search).get("company") || localStorage.getItem("xedruo_selected_company") || "xedruo-power-holdings";
  const [company, setCompany] = useState(initialCompany);
  const [projects, setProjects] = useState(starterProjects);
  const [selected, setSelected] = useState(starterProjects.find(p => p.company === initialCompany) || starterProjects[0]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([{ role: "assistant", text: "Developer workstation ready. Tell me what you want changed in this project, or upload a file/logo." }]);
  const [source, setSource] = useState(""); const [domain, setDomain] = useState(""); const [api, setApi] = useState(""); const [plugin, setPlugin] = useState("");
  const [files, setFiles] = useState([]); const [uploading, setUploading] = useState(false); const [loadingFiles, setLoadingFiles] = useState(false); const [fileError, setFileError] = useState("");
  const fileRef = useRef(null); const currentFiles = useMemo(() => files, [files]);

  useEffect(() => { localStorage.setItem("xedruo_selected_company", company); const found = projects.find(p => p.company === company); if (found) setSelected(found); }, [company, projects]);
  useEffect(() => { let cancelled = false; setLoadingFiles(true); setFileError(""); listProjectFiles(selected.id).then(rows => { if (!cancelled) setFiles(rows); }).catch(err => { if (!cancelled) setFileError(`Storage connection error: ${err.message}`); }).finally(() => { if (!cancelled) setLoadingFiles(false); }); return () => { cancelled = true; }; }, [selected.id]);

  function changeCompany(next) {
    setCompany(next);
    const existing = projects.find(p => p.company === next);
    if (!existing) { const meta = XEDRUO_COMPANIES.find(([id]) => id === next); const p = { id: next, name: meta?.[1]?.replace(/^\d+ — /, "") || next, type: "Company application", status: "Ready", company: next }; setProjects(prev => [...prev, p]); setSelected(p); }
    navigate(`/developer-workstation?company=${encodeURIComponent(next)}`, { replace: true });
  }
  function sendChat() { if (!message.trim()) return; const text = message.trim(); setChat(c => [...c, { role: "user", text }, { role: "assistant", text: `Ready to work on ${selected.name}: ${text}` }]); setMessage(""); }
  async function handleFiles(e) { const incoming = Array.from(e.target.files || []); if (!incoming.length) return; setUploading(true); setFileError(""); try { const uploaded = await uploadProjectFiles(selected.id, incoming); setFiles(f => [...uploaded, ...f]); setChat(c => [...c, { role: "assistant", text: `Uploaded ${uploaded.length} file${uploaded.length === 1 ? "" : "s"} to ${selected.name} storage.` }]); } catch (err) { setFileError(`Upload failed: ${err.message}`); } finally { setUploading(false); e.target.value = ""; } }
  async function removeFile(file) { try { await deleteProjectFile(file.path); setFiles(f => f.filter(x => x.path !== file.path)); } catch (err) { setFileError(`Delete failed: ${err.message}`); } }
  function addItem(kind, value, setter) { if (!value.trim()) return; window.alert(`${kind} saved: ${value}`); setter(""); }

  return <div className="min-h-screen bg-slate-950 text-white flex flex-col">
    <header className="border-b border-white/10 bg-slate-950/95 sticky top-0 z-20"><div className="px-5 py-4 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-cyan-300/15 grid place-items-center"><Code2 className="text-cyan-300" /></div><div><div className="font-bold">Xedruo Developer Workstation</div><div className="text-xs text-slate-500">Build, edit, integrate and manage projects</div></div></div><div className="flex items-center gap-2"><CompanySwitcher value={company} onChange={changeCompany} /><button onClick={() => navigate("/worker-access")} className="text-sm text-slate-400 hover:text-white">Change function</button></div></div></header>
    <div className="flex flex-1 min-h-0"><aside className="w-72 hidden lg:block border-r border-white/10 p-4 space-y-2 overflow-y-auto"><div className="text-xs uppercase tracking-widest text-slate-500 px-2 pb-2">Workstation menu</div>{[["Projects", FolderOpen], ["Edit app", Code2], ["Integrate app", PackagePlus], ["Connect domain", Globe2], ["3rd-party API", Link2], ["Import external source", FileUp], ["Add plugins", PackagePlus]].map(([label, Icon], i) => <button key={label} className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-left ${i === 0 ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon size={18} />{label}</button>)}<div className="pt-5"><div className="px-2 mb-2"><span className="text-xs uppercase tracking-widest text-slate-500">Projects</span></div>{projects.filter(p => p.company === company).map(p => <button key={p.id} onClick={() => setSelected(p)} className={`w-full rounded-xl px-3 py-3 text-left mb-1 ${selected.id === p.id ? "bg-cyan-300/10 border border-cyan-300/20" : "hover:bg-white/5"}`}><div className="text-sm font-medium">{p.name}</div><div className="text-xs text-slate-500">{p.type} · {p.status}</div></button>)}</div></aside>
      <main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto"><div className="max-w-7xl mx-auto"><div className="flex flex-wrap items-center justify-between gap-4 mb-5"><div><div className="text-xs uppercase tracking-widest text-cyan-300">Current project · {XEDRUO_COMPANIES.find(([id]) => id === company)?.[1] || company}</div><h1 className="text-2xl md:text-3xl font-bold mt-1">{selected.name}</h1><p className="text-sm text-slate-500">{selected.type} · {selected.status}</p></div><button onClick={() => window.alert(`Developer preview ready for ${selected.name}`)} className="rounded-xl bg-cyan-300 text-slate-950 px-4 py-2.5 font-semibold">Dev Preview</button></div>
        <div className="grid xl:grid-cols-[1.7fr_.8fr] gap-5"><section className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"><div className="px-5 py-4 border-b border-white/10"><div className="flex items-center gap-2"><MessageSquare size={18} className="text-cyan-300" /><span className="font-semibold">Chat to edit</span></div></div><div className="h-[390px] overflow-y-auto p-5 space-y-4">{chat.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${m.role === "user" ? "bg-cyan-300 text-slate-950" : "bg-black/30 text-slate-300 border border-white/10"}`}>{m.text}</div></div>)}</div><div className="p-4 border-t border-white/10"><div className="flex gap-2 items-end"><button onClick={() => fileRef.current?.click()} className="w-11 h-11 rounded-xl border border-white/10 bg-black/20 grid place-items-center hover:bg-white/10" title="Upload files, pictures or logos"><Plus size={20} /></button><input ref={fileRef} type="file" multiple accept="image/*,.pdf,.txt,.md,.json,.csv,.xlsx,.doc,.docx,.zip,.js,.jsx,.ts,.tsx,.css,.html,.svg" className="hidden" onChange={handleFiles} /><textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }} placeholder="Describe the change you want..." className="min-h-[46px] max-h-32 flex-1 rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm outline-none focus:border-cyan-300/40" /><button onClick={sendChat} className="w-11 h-11 rounded-xl bg-cyan-300 text-slate-950 grid place-items-center"><Send size={18} /></button></div><div className="mt-2 text-xs text-slate-600">{uploading ? "Uploading to Xedruo Storage..." : "Press + to upload source files, screenshots, pictures or logos."}</div></div></section>
          <section className="space-y-5"><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><h2 className="font-semibold flex items-center gap-2"><PackagePlus size={18} className="text-cyan-300" /> External builder</h2><p className="text-xs text-slate-500 mt-1">Choose the external source/builder for this project.</p><select value={source} onChange={e => setSource(e.target.value)} className="mt-3 w-full rounded-xl bg-black/30 border border-white/10 p-3 text-sm"><option value="">Select builder...</option>{tools.map(t => <option key={t}>{t}</option>)}</select></div><div className="rounded-2xl border border-white/10 bg-white/5 p-5"><h2 className="font-semibold flex items-center gap-2"><Globe2 size={18} className="text-cyan-300" /> Connections</h2><div className="space-y-3 mt-4"><div className="flex gap-2"><input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" className="min-w-0 flex-1 rounded-xl bg-black/30 border border-white/10 p-3 text-sm" /><button onClick={() => addItem("Domain", domain, setDomain)} className="rounded-xl bg-white/10 px-3"><ExternalLink size={16} /></button></div><div className="flex gap-2"><input value={api} onChange={e => setApi(e.target.value)} placeholder="API base URL / integration" className="min-w-0 flex-1 rounded-xl bg-black/30 border border-white/10 p-3 text-sm" /><button onClick={() => addItem("API", api, setApi)} className="rounded-xl bg-white/10 px-3"><Link2 size={16} /></button></div><div className="flex gap-2"><select value={plugin} onChange={e => setPlugin(e.target.value)} className="min-w-0 flex-1 rounded-xl bg-black/30 border border-white/10 p-3 text-sm"><option value="">Add plugin...</option><option>GitHub</option><option>Supabase</option><option>Vercel</option><option>Render</option><option>Slack</option><option>Google Drive</option></select><button onClick={() => addItem("Plugin", plugin, setPlugin)} className="rounded-xl bg-white/10 px-3"><PackagePlus size={16} /></button></div></div></div></section></div>
        <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold flex items-center gap-2"><ImageIcon size={18} className="text-cyan-300" /> Project files & media</h2><p className="text-xs text-slate-500 mt-1">Files persist in Xedruo Supabase Storage under the selected project.</p></div><button onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-xl bg-white/10 px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"><Upload size={16} /> {uploading ? "Uploading…" : "Upload"}</button></div>{fileError && <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300">{fileError}</div>}<div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">{loadingFiles ? <div className="col-span-full rounded-xl border border-white/10 p-8 text-center text-sm text-slate-600">Loading project files…</div> : currentFiles.length === 0 ? <div className="col-span-full rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-600">No imported files yet. Use + in Chat to edit or Upload here.</div> : currentFiles.map((f, i) => <div key={f.path || i} className="rounded-xl border border-white/10 bg-black/20 overflow-hidden relative group">{f.type.startsWith("image/") ? <img src={f.url} alt={f.name} className="w-full h-24 object-cover" /> : <div className="h-24 grid place-items-center"><FileUp className="text-cyan-300" /></div>}<div className="p-2 text-xs truncate pr-8">{f.name}</div><button onClick={() => removeFile(f)} className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/70 grid place-items-center opacity-0 group-hover:opacity-100" title="Delete"><Trash2 size={13} /></button></div>)}</div></section>
      </div></main></div>
  </div>;
}
