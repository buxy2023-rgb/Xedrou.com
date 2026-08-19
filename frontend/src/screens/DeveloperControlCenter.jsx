import React, { useEffect, useMemo, useState } from "react";
import { developerClient } from "../lib/developerClient";

export default function DeveloperControlCenter() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [features, setFeatures] = useState("");
  const [result, setResult] = useState(null);

  const company = selected?.companies || {};
  const domainPreview = useMemo(() => `${selected?.slug || "project"}.com`, [selected]);

  useEffect(() => {
    let alive = true;
    developerClient.listProjects()
      .then((data) => { if (!alive) return; setProjects(data.projects || []); setSelected(data.projects?.[0] || null); })
      .catch((err) => { if (alive) setError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDescription(selected.description || "");
    setIndustry(company.industry || "");
    setFeatures("");
    setResult(null);
  }, [selected?.id]);

  const selectProject = async (project) => {
    setError("");
    setSelected(project);
    try {
      const data = await developerClient.getProject(project.id);
      setSelected(data.project);
    } catch (err) {
      setError(err.message);
    }
  };

  const advance = async () => {
    if (!selected) return;
    setWorking(true);
    setError("");
    try {
      const data = await developerClient.advanceProject(selected.id, {
        industry,
        description,
        domain: domainPreview,
        features: features.split(/\n|,/).map((item) => item.trim()).filter(Boolean),
      });
      setSelected(data.project);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="text-slate-400">Loading developer projects…</div></main>;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-7">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Xedruo Power Holdings</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mt-2">
            <div>
              <h1 className="text-3xl md:text-5xl font-semibold">Developer Workspace</h1>
              <p className="text-slate-400 mt-2 max-w-3xl">Log in as a developer, select the company project, then advance that company from one controlled workspace.</p>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">Developer access</span>
          </div>
        </header>

        {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        <div className="grid lg:grid-cols-[300px_1fr] gap-5">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-3 h-fit">
            <div className="px-3 py-2 mb-2"><p className="text-xs uppercase tracking-wider text-slate-500">Projects</p><p className="text-sm text-slate-300 mt-1">Select a company to work on</p></div>
            <div className="space-y-1 max-h-[70vh] overflow-auto">
              {projects.map((project) => (
                <button key={project.id} onClick={() => selectProject(project)} className={`w-full rounded-xl px-3 py-3 text-left transition ${selected?.id === project.id ? "bg-white text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}>
                  <div className="font-medium">{project.name}</div>
                  <div className={`text-xs mt-1 ${selected?.id === project.id ? "text-slate-500" : "text-slate-500"}`}>{project.companies?.industry || "Company platform"}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-5">
            {selected ? <>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-7">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div><p className="text-sm text-slate-500">Selected project</p><h2 className="text-2xl md:text-3xl font-semibold mt-1">{selected.name}</h2><p className="text-slate-400 mt-1">{selected.slug}.com · {company.industry || "Company"}</p></div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{selected.status}</span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <label className="block"><span className="text-sm text-slate-400">Industry</span><input value={industry} onChange={(e) => setIndustry(e.target.value)} className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-slate-400" placeholder="Technology, energy, logistics…" /></label>
                  <label className="block"><span className="text-sm text-slate-400">Project domain</span><input value={domainPreview} readOnly className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-slate-400" /></label>
                </div>
                <label className="block mt-4"><span className="text-sm text-slate-400">What should the developer advance?</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-slate-400" placeholder="Describe the website, app, customer portal, staff tools, infrastructure and business functions." /></label>
                <label className="block mt-4"><span className="text-sm text-slate-400">Features / work items</span><textarea value={features} onChange={(e) => setFeatures(e.target.value)} rows={3} className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-slate-400" placeholder="Website, customer portal, payments, analytics, AI…" /></label>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button disabled={working} onClick={advance} className="rounded-xl bg-white text-slate-950 px-5 py-3 font-semibold disabled:opacity-50">{working ? "Advancing project…" : "Start advancing project"}</button>
                  <span className="text-xs text-slate-500">Creates a tracked build and initializes the company workspace.</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {["Website Builder", "Application Builder", "Infrastructure"].map((item) => <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-xs uppercase tracking-wider text-slate-500">Developer module</p><h3 className="text-lg font-semibold mt-2">{item}</h3><p className="text-sm text-slate-500 mt-2">Ready for this selected company project.</p></div>)}
              </div>

              {result && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5"><p className="text-sm text-emerald-300">Project advanced successfully.</p><p className="text-slate-300 mt-2">Build ID: <span className="font-mono text-xs">{result.build.id}</span></p><p className="text-slate-400 text-sm mt-1">Initialized pages: {result.pages.join(", ")}</p></div>}
            </> : <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">No developer projects are available for this account.</div>}
          </section>
        </div>
      </div>
    </main>
  );
}
