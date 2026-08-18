import React, { useMemo, useState } from 'react';

const companies = [
  'Xedruo', 'Sportruo', 'Hireruo', 'Adom', 'Agruo', 'Heathrou',
  'Xedruo Education', 'Xedruo Capital', 'Xedruo Energy', 'Xedruo Logistics',
  'Xedruo Properties', 'Spacetruo', 'Xedruo AI', 'Xedruo Power Holdings'
];

export default function DeveloperControlCenter() {
  const [selected, setSelected] = useState(companies[0]);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('Ready');

  const domainPreview = useMemo(() => {
    const slug = (name || selected).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `${slug}.com`;
  }, [name, selected]);

  const generate = () => {
    setStatus('Company specification created. Connect this action to the internal generator service.');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Xedruo Power Holdings</p>
          <h1 className="text-3xl md:text-5xl font-semibold mt-2">Developer Control Center</h1>
          <p className="text-slate-400 mt-3 max-w-3xl">Technical command center for building, editing and preparing companies, websites and applications inside the Xedruo platform.</p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="font-medium mb-3">Companies</h2>
            <div className="space-y-1">
              {companies.map((company) => (
                <button key={company} onClick={() => setSelected(company)} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selected === company ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}>
                  {company}
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div><p className="text-sm text-slate-400">Selected company</p><h2 className="text-2xl font-semibold">{selected}</h2></div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs">Developer access</span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block"><span className="text-sm text-slate-400">New company name</span><input value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-slate-400" placeholder="Company name" /></label>
                <label className="block"><span className="text-sm text-slate-400">Industry</span><input value={industry} onChange={e => setIndustry(e.target.value)} className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-slate-400" placeholder="Technology, logistics, media..." /></label>
              </div>
              <label className="block mt-4"><span className="text-sm text-slate-400">Build specification</span><textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6} className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 outline-none focus:border-slate-400" placeholder="Describe the website, app, customer portal, staff tools and business functions you want the internal company builder to create." /></label>
              <div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={generate} className="rounded-xl bg-white text-slate-950 px-5 py-3 font-medium hover:bg-slate-200">Create company specification</button><span className="text-sm text-slate-400">Domain preview: <strong className="text-slate-200">{domainPreview}</strong></span></div>
              <p className="mt-4 text-sm text-slate-400">Status: {status}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {['Website Builder', 'Application Builder', 'Infrastructure'].map((item) => <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-slate-400 text-sm">Developer module</p><h3 className="font-semibold text-lg mt-1">{item}</h3><p className="text-sm text-slate-500 mt-2">Internal module reserved for the Xedruo platform generator.</p></div>)}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
