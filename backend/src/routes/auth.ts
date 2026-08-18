import { Router } from "express";
import { supabaseAdmin, supabaseAnon, supabaseForToken } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

function sessionPayload(session: any) {
  if (!session) return null;
  return { access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at };
}

router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });
  const { data, error } = await supabaseAnon.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  if (data.session) await supabaseAdmin.from("profiles").upsert({ id: data.user!.id, email, role: "user" }, { onConflict: "id" });
  res.status(201).json({ session: sessionPayload(data.session), requiresVerification: !data.session });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ session: sessionPayload(data.session) });
});

router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body || {};
  if (!refresh_token) return res.status(400).json({ error: "refresh_token is required" });
  const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ session: sessionPayload(data.session) });
});

router.post("/logout", requireAuth, async (req: AuthedRequest, res) => {
  try { await supabaseAdmin.auth.admin.signOut(req.accessToken!, "global"); } catch {}
  res.status(204).send();
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  let { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", req.user!.id).maybeSingle();
  if (!profile) {
    const { data: created } = await supabaseAdmin.from("profiles").upsert({ id: req.user!.id, email: req.user!.email, role: "user" }, { onConflict: "id" }).select().single();
    profile = created;
  }
  res.json({ id: req.user!.id, email: req.user!.email, role: profile?.role ?? "user", ...profile });
});

router.post("/verify-otp", async (req, res) => {
  const { email, otpCode } = req.body || {};
  if (!email || !otpCode) return res.status(400).json({ error: "email and otpCode are required" });
  const { data, error } = await supabaseAnon.auth.verifyOtp({ email, token: otpCode, type: "signup" });
  if (error) return res.status(400).json({ error: error.message });
  if (data.user) await supabaseAdmin.from("profiles").upsert({ id: data.user.id, email, role: "user" }, { onConflict: "id" });
  res.json({ session: sessionPayload(data.session) });
});

router.post("/resend-otp", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email is required" });
  const { error } = await supabaseAnon.auth.resend({ type: "signup", email });
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

router.post("/reset-password-request", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email is required" });
  const redirectTo = `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/reset-password`;
  const { error } = await supabaseAnon.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

router.post("/reset-password", async (req, res) => {
  const { recoveryAccessToken, newPassword } = req.body || {};
  if (!recoveryAccessToken || !newPassword) return res.status(400).json({ error: "recoveryAccessToken and newPassword are required" });
  const scoped = supabaseForToken(recoveryAccessToken);
  const { error } = await scoped.auth.updateUser({ password: newPassword });
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

router.get("/oauth-url", (req, res) => {
  const provider = String(req.query.provider || "google");
  const redirectPath = String(req.query.redirect_path || "/dashboard");
  const callbackUrl = `${process.env.FRONTEND_ORIGIN || "http://localhost:3000"}/auth/callback?next=${encodeURIComponent(redirectPath)}`;
  const authorizeUrl = `${process.env.SUPABASE_URL}/auth/v1/authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(callbackUrl)}`;
  res.json({ url: authorizeUrl });
});

router.post("/complete-registration", requireAuth, async (req: AuthedRequest, res) => {
  const role = ["developer","accountant","customer_service","staff"].includes(req.body?.role) ? req.body.role : "user";
  const company_slug = typeof req.body?.company_slug === "string" ? req.body.company_slug : null;
  const job_role = typeof req.body?.job_role === "string" ? req.body.job_role : null;
  const { data, error } = await supabaseAdmin.from("profiles").upsert({ id: req.user!.id, role, company_slug, job_role }, { onConflict: "id" }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
