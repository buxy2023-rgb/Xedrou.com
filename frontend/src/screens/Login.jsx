import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserRound, Lock, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

async function finishWorkforceSetup() {
  const raw = localStorage.getItem("xedruo_pending_workforce");
  if (!raw) return false;
  try {
    const selection = JSON.parse(raw);
    const api = process.env.NEXT_PUBLIC_API_URL || "https://xedruo-backend.onrender.com";
    const session = JSON.parse(localStorage.getItem("xedruo_session") || "null");
    if (!session?.access_token) return false;
    const res = await fetch(`${api}/api/auth/complete-registration`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(selection) });
    if (!res.ok) return false;
    localStorage.removeItem("xedruo_pending_workforce");
    return true;
  } catch { return false; }
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const workerLogin = searchParams.get("worker") === "1" || searchParams.get("developer") === "1" || window.location.pathname === "/developer-login";
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const value = loginId.trim();
      const isUsername = !value.includes("@");
      if (isUsername || workerLogin) {
        const pending = JSON.parse(localStorage.getItem("xedruo_pending_workforce") || "null");
        if (workerLogin && pending && pending.company_slug !== "xedruo-power-holdings") throw new Error("This secure staff login is for Power Holdings employees.");
        const developer = await base44.auth.loginDeveloper(value, password);
        if (pending) await finishWorkforceSetup();
        const isCEO = String(developer?.username || value).trim().toUpperCase() === "CEO";
        const isAdmin = developer?.role === "admin" || developer?.role === "ceo" || isCEO;
        window.location.href = isAdmin ? "/developer" : "/worker-portal";
      } else {
        await base44.auth.loginViaEmailPassword(value, password);
        const worker = await finishWorkforceSetup();
        window.location.href = worker ? "/worker-portal" : "/dashboard";
      }
    } catch(err) { setError(err.message || "Unable to sign in"); }
    finally { setLoading(false); }
  };

  return <AuthLayout icon={workerLogin ? ShieldCheck : LogIn} title={workerLogin ? "Power Holdings Staff Login" : "Welcome back"} subtitle={workerLogin ? "Username and password required" : "Sign in with your username or email and password"} footer={!workerLogin ? <>Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link></> : <>Authorized staff only</>}>
    {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="loginId">Username or Email</Label><div className="relative"><UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input id="loginId" type="text" autoComplete="username" autoFocus placeholder="Enter username or email" value={loginId} onChange={e=>setLoginId(e.target.value)} className="pl-10 h-12" required/></div></div>
      <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label>{!workerLogin && <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>}</div><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} className="pl-10 pr-12 h-12" required/><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"} onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}</button></div></div>
      <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>{loading?<><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Signing in...</>:"Log in"}</Button>
    </form>
  </AuthLayout>;
}
