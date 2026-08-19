import React, { useEffect, useMemo, useState } from "react";
import { Wallet, Send, Plus, CreditCard, ArrowUpRight, Music2, Plane, Car, TrendingUp, ReceiptText, ShoppingBag, Ticket, Sparkles, ShieldCheck, Phone, Globe2, Copy, Check, Loader2, Bell, Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://xedruo-backend.onrender.com";
const SESSION_KEY = "xedruo_session";
const preferredCountries = [
  ["NG", "Nigeria", "NGN"], ["US", "United States", "USD"], ["GB", "United Kingdom", "GBP"], ["CA", "Canada", "CAD"],
  ["DE", "Germany", "EUR"], ["GH", "Ghana", "GHS"], ["KE", "Kenya", "KES"], ["ZA", "South Africa", "ZAR"],
  ["IN", "India", "INR"], ["AE", "UAE", "AED"], ["AU", "Australia", "AUD"]
];

const services = [
  ["sportruo", "Sportruo", "Sports & prediction services", TrendingUp],
  ["hireuo", "Hireuo", "Jobs and workforce", Building2],
  ["adom", "Adom", "Marketplace & services", ShoppingBag],
  ["agruo", "Agruo", "Agriculture services", Globe2],
  ["healthruo", "Healthruo", "Health services", ShieldCheck],
  ["xedruo-education", "Xedruo Education", "Education", Building2],
  ["xedruo-capital", "Xedruo Capital", "Investment services", TrendingUp],
  ["xedruo-energy", "Xedruo Energy", "Energy services", Globe2],
  ["xedruo-logistics", "Xedruo Logistics", "Logistics", Car],
  ["xedruo-properties", "Xedruo Properties", "Property services", Building2],
  ["spacetruo", "Spacetruo", "Flights & space services", Plane],
  ["enit-ai", "Enit AI", "AI services", Sparkles],
  ["xedruo", "Xedruo Music", "Music & artist services", Music2],
];

function getToken() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null")?.access_token || ""; } catch { return ""; }
}
async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export default function PayAndPlay() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("NG");
  const [provisioning, setProvisioning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transfer, setTransfer] = useState({ recipient: "", amount: "", currency: "NGN", description: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setLoading(true); setError(""); setData(await api("/api/pay-play/overview")); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const primary = useMemo(() => data?.balances?.find((b) => b.is_primary) || data?.balances?.[0], [data]);
  const totalActivity = useMemo(() => (data?.transactions || []).slice(0, 5), [data]);

  const provision = async () => {
    if (!phone) return setError("Enter your phone number to create your Xedruo account number.");
    try {
      setProvisioning(true); setError("");
      await api("/api/pay-play/provision", { method: "POST", body: JSON.stringify({ phone, countryCode: country, companySlug: "pay-and-play" }) });
      await load();
    } catch (e) { setError(e.message); }
    finally { setProvisioning(false); }
  };

  const send = async () => {
    try {
      setBusy(true); setError("");
      await api("/api/pay-play/transfer", { method: "POST", body: JSON.stringify({ ...transfer, amount: Number(transfer.amount) }) });
      setTransferOpen(false); setTransfer({ recipient: "", amount: "", currency: primary?.currency || "NGN", description: "" });
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const order = async (serviceType, companySlug, title) => {
    try {
      setBusy(true); setError("");
      await api("/api/pay-play/order", { method: "POST", body: JSON.stringify({ serviceType, companySlug, title, currency: primary?.currency || "NGN", amount: 0 }) });
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const requestKyc = async () => {
    try { setBusy(true); await api("/api/pay-play/kyc", { method: "POST", body: JSON.stringify({ countryCode: country, documentType: "government_id" }) }); await load(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!data?.provisioned) return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="rounded-3xl border border-primary/20 bg-card p-7 shadow-sm">
        <div className="flex items-center gap-3"><div className="rounded-2xl bg-primary/10 p-3 text-primary"><Wallet /></div><div><div className="text-xs uppercase tracking-[.25em] text-primary">Pay & Play</div><h1 className="text-3xl font-bold">Your Xedruo account is ready to create</h1></div></div>
        <p className="mt-4 text-muted-foreground">Sign in with your Gmail/Xedruo account, add your phone number and Xedruo will create one universal Xedruo ID plus your Pay & Play account number.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><div><Label>Phone number</Label><Input className="mt-2" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." /></div><div><Label>Main account region</Label><select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{preferredCountries.map(([code, name, currency]) => <option key={code} value={code}>{name} — {currency}</option>)}</select></div></div>
        <Button className="mt-5 w-full" onClick={provision} disabled={provisioning}>{provisioning ? <Loader2 className="mr-2 animate-spin" /> : <Phone className="mr-2" />}Create Pay & Play</Button>
        {error && <div className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      </div>
    </div>
  );

  const copyId = async () => { await navigator.clipboard.writeText(data.account.xedruo_id); setCopied(true); setTimeout(() => setCopied(false), 1800); };

  return (
    <div className="pb-16">
      <PageHeader title="Xedruo Pay & Play" subtitle="One wallet for local and international Xedruo services, transfers and music." action={<div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"><Globe2 className="h-4 w-4" /> {data.account.primary_currency} main balance</div>} />
      {error && <div className="mb-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="relative overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-card via-card to-primary/10 p-7 shadow-sm">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4" /> Total balance</div><span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">Xedruo Wallet</span></div>
          <div className="mt-3 text-5xl font-black tracking-tight">{primary?.currency || data.account.primary_currency} {Number(primary?.balance || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" /> {data.account.phone_account_number}<span>•</span><button onClick={copyId} className="inline-flex items-center gap-1 text-foreground hover:text-primary">Xedruo ID {data.account.xedruo_id}{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}</button></div>
          <div className="mt-7 flex flex-wrap gap-3"><Dialog open={transferOpen} onOpenChange={setTransferOpen}><DialogTrigger asChild><Button><Send className="mr-2 h-4 w-4" /> Send</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Send Xedruo money</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Phone or Xedruo ID</Label><Input className="mt-2" value={transfer.recipient} onChange={(e)=>setTransfer({...transfer,recipient:e.target.value})} placeholder="080... or 10-digit Xedruo ID" /></div><div className="grid grid-cols-2 gap-3"><div><Label>Amount</Label><Input className="mt-2" type="number" value={transfer.amount} onChange={(e)=>setTransfer({...transfer,amount:e.target.value})} /></div><div><Label>Currency</Label><select className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={transfer.currency} onChange={(e)=>setTransfer({...transfer,currency:e.target.value})}>{(data.balances || []).map((b)=><option key={b.currency}>{b.currency}</option>)}</select></div></div><div><Label>Note</Label><Input className="mt-2" value={transfer.description} onChange={(e)=>setTransfer({...transfer,description:e.target.value})} placeholder="Optional" /></div><Button className="w-full" onClick={send} disabled={busy}>{busy ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Send money</Button></div></DialogContent></Dialog><Button variant="outline" onClick={()=>order("deposit","pay-and-play","Add money")}><Plus className="mr-2 h-4 w-4" /> Add</Button><Button variant="outline" onClick={()=>order("card","pay-and-play","Get Xedruo card")}><CreditCard className="mr-2 h-4 w-4" /> Card</Button><Button variant="outline" onClick={()=>order("bill","pay-and-play","Pay a bill")}><ReceiptText className="mr-2 h-4 w-4" /> Bills</Button></div></div></div>

        <div className="rounded-[28px] border border-border bg-card p-6"><div className="flex items-center gap-2 font-semibold"><Globe2 className="h-5 w-5 text-primary" /> Balances</div><div className="mt-4 space-y-3">{(data.balances || []).map((b)=><div key={b.currency} className="flex items-center justify-between rounded-2xl bg-muted/40 p-4"><div><div className="font-semibold">{b.currency}</div><div className="text-xs text-muted-foreground">{b.is_primary ? "Main regional balance" : "Preferred balance"}</div></div><div className="font-bold">{Number(b.balance||0).toLocaleString(undefined,{minimumFractionDigits:2})}</div></div>)}</div><p className="mt-4 text-xs text-muted-foreground">Your region selects the main currency. Up to three preferred currencies stay available alongside it.</p></div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Book a ride",Car,"ride","xedruo-logistics"],["Book a flight",Plane,"flight","spacetruo"],["Invest",TrendingUp,"invest","xedruo-capital"],["Receive money",ArrowUpRight,"receive","pay-and-play"]].map(([title,Icon,type,company])=><button key={title} onClick={()=>order(type,company,title)} className="rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/40"><Icon className="h-5 w-5 text-primary"/><div className="mt-4 font-semibold">{title}</div><div className="mt-1 text-xs text-muted-foreground">Open service request</div></button>)}</div>

      <div className="mt-8 rounded-[28px] border border-border bg-card p-6"><div className="flex items-center justify-between gap-4"><div><div className="flex items-center gap-2 font-semibold"><Music2 className="h-5 w-5 text-primary" /> Music World</div><p className="mt-1 text-sm text-muted-foreground">Tickets, artist stores and artist bookings inside Pay & Play.</p></div><Button variant="outline" onClick={()=>order("music_ticket","xedruo","Open Music World")}><Music2 className="mr-2 h-4 w-4" /> Open</Button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><button onClick={()=>order("music_ticket","xedruo","Buy artist ticket")} className="rounded-2xl bg-muted/50 p-4 text-left"><Ticket className="h-5 w-5 text-primary"/><div className="mt-3 font-semibold">Buy artist ticket</div><div className="text-xs text-muted-foreground">Fan ticketing</div></button><button onClick={()=>order("artist_store","xedruo","Artist store")} className="rounded-2xl bg-muted/50 p-4 text-left"><ShoppingBag className="h-5 w-5 text-primary"/><div className="mt-3 font-semibold">Artist store</div><div className="text-xs text-muted-foreground">Shirts, bags, belts, sneakers & shoes</div></button><button onClick={()=>order("artist_booking","xedruo","Book artist")} className="rounded-2xl bg-muted/50 p-4 text-left"><Music2 className="h-5 w-5 text-primary"/><div className="mt-3 font-semibold">Book an artist</div><div className="text-xs text-muted-foreground">Shows, parties & appearances</div></button></div></div>

      <div className="mt-8"><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-bold">All Xedruo services</h2><p className="text-sm text-muted-foreground">Registering for a company automatically links it to your Pay & Play identity.</p></div><span className="text-xs text-muted-foreground">{data.services?.length || 0} connected</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{services.map(([slug,name,desc,Icon])=>{const connected=data.services?.some((s)=>s.company_slug===slug); return <button key={slug} onClick={()=>order("service",slug,`Open ${name}`)} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/40"><div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5"/></div><div className="min-w-0 flex-1"><div className="font-semibold">{name}</div><div className="truncate text-xs text-muted-foreground">{desc}</div></div><span className={`text-[10px] font-semibold ${connected ? "text-green-600" : "text-muted-foreground"}`}>{connected ? "CONNECTED" : "OPEN"}</span></button>})}</div></div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-primary" /> Account verification</div><p className="mt-2 text-sm text-muted-foreground">Current tier: <b>{data.account.tier}</b>. KYC increases your transfer limits when approved.</p><Button className="mt-4" variant="outline" onClick={requestKyc} disabled={busy}>Start KYC</Button></div><div className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center gap-2 font-semibold"><Bell className="h-5 w-5 text-primary" /> Recent activity</div><div className="mt-3 space-y-3">{totalActivity.length===0 && <div className="text-sm text-muted-foreground">No transactions yet.</div>}{totalActivity.map(t=><div key={t.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{t.description || t.transaction_type}</span><span className={t.direction==='credit'?'text-green-600':'text-foreground'}>{t.direction==='credit'?'+':'-'}{Number(t.amount).toLocaleString()} {t.currency}</span></div>)}</div></div></div>

      <div className="fixed bottom-5 right-5 z-20"><button onClick={()=>order("music_ticket","xedruo","Music World")} className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 ring-background" title="Music World"><Music2 /></button></div>
    </div>
  );
}
