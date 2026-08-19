import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { HardDrive, RefreshCw, Server, Users, Database, ShieldCheck, AlertCircle } from "lucide-react";

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** i).toFixed(i ? 2 : 0)} ${units[i]}`;
}

function Card({ icon: Icon, title, value, subtitle }) {
  return <div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2.5"><Icon className="w-5 h-5 text-primary" /></div><div className="min-w-0"><div className="text-sm text-muted-foreground">{title}</div><div className="text-2xl font-bold mt-1">{value}</div><div className="text-xs text-muted-foreground mt-1">{subtitle}</div></div></div></div>;
}

export default function PlatformUsageDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await base44.platformUsage.get();
      setMetrics(data); setUpdated(new Date());
    } catch (err) {
      setError(err?.message || "Could not load platform usage");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const timer = setInterval(load, 60000); return () => clearInterval(timer); }, [load]);

  const buckets = useMemo(() => Array.isArray(metrics?.buckets) ? metrics.buckets : [], [metrics]);
  const storageLimit = 1024 ** 4;
  const storagePercent = Math.min(100, Number(metrics?.storage_bytes || 0) / storageLimit * 100);

  return <div className="min-h-screen bg-background p-5 md:p-8">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6"><div><div className="text-xs uppercase tracking-[.25em] text-primary">Executive monitoring</div><h1 className="text-3xl font-bold mt-1">Users & File Storage</h1><p className="text-muted-foreground mt-2">Live platform capacity and user-growth overview for Xedruo.</p></div><button onClick={load} disabled={loading} className="rounded-xl border border-border px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-muted disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button></div>

      {error && <div className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm flex items-center gap-3"><AlertCircle className="w-5 h-5 text-destructive" />{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={Users} title="Total users" value={loading ? "—" : Number(metrics?.total_users || 0).toLocaleString()} subtitle="Registered authentication accounts" />
        <Card icon={ShieldCheck} title="Active users" value={loading ? "—" : Number(metrics?.active_users || 0).toLocaleString()} subtitle="Active workforce profiles" />
        <Card icon={Users} title="New users · 7 days" value={loading ? "—" : Number(metrics?.new_users_7d || 0).toLocaleString()} subtitle="Recent registrations" />
        <Card icon={HardDrive} title="Stored files" value={loading ? "—" : Number(metrics?.total_files || 0).toLocaleString()} subtitle={loading ? "" : formatBytes(metrics?.storage_bytes)} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold flex items-center gap-2"><HardDrive className="w-5 h-5 text-primary" /> Storage capacity</h2><p className="text-xs text-muted-foreground mt-1">Current Xedruo storage footprint across all configured buckets.</p></div><span className="text-sm font-semibold">{loading ? "—" : formatBytes(metrics?.storage_bytes)}</span></div><div className="mt-5 h-3 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${storagePercent}%` }} /></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>0 B</span><span>Monitoring reference: 1 TB</span></div></section>
        <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> Storage buckets</h2><div className="mt-4 space-y-3">{buckets.length === 0 ? <div className="text-sm text-muted-foreground">No stored objects yet.</div> : buckets.map((b) => <div key={b.bucket} className="rounded-xl bg-muted/50 px-4 py-3 flex items-center justify-between"><div><div className="text-sm font-medium">{b.bucket}</div><div className="text-xs text-muted-foreground">{Number(b.files || 0).toLocaleString()} files</div></div><div className="text-sm font-semibold">{formatBytes(b.bytes)}</div></div>)}</div></section>
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-3"><Server className="w-5 h-5 text-primary" /><div><h2 className="font-semibold">Capacity planning</h2><p className="text-sm text-muted-foreground mt-1">This dashboard is designed to track growth before infrastructure becomes a bottleneck.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-muted/50 p-4"><div className="text-xs text-muted-foreground">User growth</div><div className="font-semibold mt-1">Track daily / weekly / monthly</div></div><div className="rounded-xl bg-muted/50 p-4"><div className="text-xs text-muted-foreground">Storage growth</div><div className="font-semibold mt-1">Track files + bytes by bucket</div></div><div className="rounded-xl bg-muted/50 p-4"><div className="text-xs text-muted-foreground">Next scale trigger</div><div className="font-semibold mt-1">Add secondary storage / analytics when needed</div></div></div></section>

      <div className="mt-4 text-xs text-muted-foreground text-center">{updated ? `Last updated ${updated.toLocaleString()}` : "Waiting for metrics…"} · Executive-only metrics API</div>
    </div>
  </div>;
}
