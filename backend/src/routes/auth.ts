import { Router } from "express";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { supabaseAdmin, supabaseAnon, supabaseForToken } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

function sessionPayload(session: any) {
  if (!session) return null;
  return { access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at };
}

function verifyPassword(password: string, encoded: string) {
  const [saltB64, hashB64] = String(encoded || "").split("$");
  if (!saltB64 || !hashB64) return false;
  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const actual = scryptSync(password, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}

function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }

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

// Dedicated internal login for Power Holdings Developer Unit.
// Passwords are verified against scrypt hashes; the plaintext password is never stored.
router.post("/developer-login", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!username || !password) return res.status(400).json({ error: "username and password are required" });

  const { data: account, error } = await supabaseAdmin
    .from("developer_accounts")
    .select("id,username,display_name,role,company_slug,password_hash,is_active")
    .ilike("username", username)
    .maybeSingle();
  if (error || !account || !account.is_active || !verifyPassword(password, account.password_hash)) {
    return res.status(401).json({ error: "Invalid developer username or password" });
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin.from("developer_sessions").delete().eq("account_id", account.id);
  const { error: sessionError } = await supabaseAdmin.from("developer_sessions").insert({ account_id: account.id, token_hash: hashToken(token), expires_at: expiresAt });
  if (sessionError) return res.status(500).json({ error: "Unable to create developer session" });

  res.json({ session: { access_token: token, refresh_token: null, expires_at: Math.floor(new Date(expiresAt).getTime() / 1000) }, developer: { username: account.username, name: account.display_name, role: account.role, company_slug: account.company_slug } });
});

router.post("/developer-logout", requireAuth, async (req: AuthedRequest, res) => {
  if (req.accessToken) await supabaseAdmin.from("developer_sessions").delete().eq("token_hash", hashToken(req.accessToken));
  res.status(204).send();
});

router.get("/developer-accounts", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "CEO access required" });
  const { data, error } = await supabaseAdmin.from("developer_accounts").select("id,username,display_name,role,company_slug,is_active,created_at,deleted_at").order("created_at");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ accounts: data || [] });
});

router.delete("/developer-accounts/:id", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "CEO access required" });
  if (req.params.id === req.user.id) return res.status(400).json({ error: "CEO account cannot be deleted here" });
  const { error } = await supabaseAdmin.from("developer_accounts").update({ is_active: false, deleted_at: new Date().toISOString() }).eq("id", req.params.id).eq("role", "developer");
  if (error) return res.status(500).json({ error: error.message });
  await supabaseAdmin.from("developer_sessions").delete().eq("account_id", req.params.id);
  res.status(204).send();
});

router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body || {};
  if (!refresh_token) return res.status(400).json({ error: "refresh_token is required" });
  const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token });
  if (error) return res.status(401).json({ error: error.message });
  res.json({ session: sessionPayload(data.session) });
});

router.post("/logout", requireAuth, async (req: AuthedRequest, res) => {
  if (req.accessToken) {
    await supabaseAdmin.from("developer_sessions").delete().eq("token_hash", hashToken(req.accessToken));
    try { await supabaseAdmin.auth.admin.signOut(req.accessToken, "global"); } catch {}
  }
  res.status(204).send();
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user?.username) {
    const { data: account } = await supabaseAdmin.from("developer_accounts").select("id,username,display_name,role,company_slug,is_active").eq("id", req.user.id).maybeSingle();
    if (!account?.is_active) return res.status(401).json({ error: "Developer account is inactive" });
    return res.json({ id: account.id, email: `${account.username.toLowerCase()}@xedruo.local`, role: account.role, username: account.username, full_name: account.display_name, company_slug: account.company_slug, is_active: account.is_active });
  }
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
  const { data, error } = await supabaseAdmin.from("profiles").upsert({ id: req.user!.id, email: req.user!.email, role, company_slug, job_role }, { onConflict: "id" }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
