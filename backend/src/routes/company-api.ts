import { Router } from "express";
import crypto from "crypto";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { CompanyApiRequest, companyApiAudit, requireCompanyApiKey, requireCompanyScope } from "../middleware/companyApi";

const router = Router();
const KEY_PREFIX = "xapi_";

async function admin(req: AuthedRequest) {
  const { data } = await supabaseAdmin.from("profiles").select("id,role,is_active").eq("id", req.user!.id).maybeSingle();
  return !!data?.is_active && data.role === "admin";
}

router.post("/keys", requireAuth, async (req: AuthedRequest, res) => {
  if (!(await admin(req))) return res.status(403).json({ error: "Company API administration required" });
  const { company_id, name, scopes = [], expires_at } = req.body || {};
  if (!company_id || !name) return res.status(400).json({ error: "company_id and name are required" });
  const raw = KEY_PREFIX + crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const { data, error } = await supabaseAdmin.from("company_api_keys").insert({ company_id, key_prefix: raw.slice(0, 13), key_hash: hash, name, scopes, expires_at: expires_at || null, created_by: req.user!.id }).select("id,company_id,key_prefix,name,scopes,status,expires_at,created_at").single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ key: raw, record: data, warning: "Store this key securely. It will not be shown again." });
});

router.post("/connections", requireAuth, async (req: AuthedRequest, res) => {
  if (!(await admin(req))) return res.status(403).json({ error: "Partner connection administration required" });
  const { company_id, partner_company_id, provider_name, connection_name, auth_type, scopes = [], base_url, secret_ref, metadata = {} } = req.body || {};
  if (!company_id || !provider_name || !connection_name || !auth_type) return res.status(400).json({ error: "company_id, provider_name, connection_name and auth_type are required" });
  if (secret_ref && /^\s*(sk-|xapi_|eyJ)/.test(secret_ref)) return res.status(400).json({ error: "Raw credentials must not be stored here; provide a secret reference" });
  const { data, error } = await supabaseAdmin.from("company_api_connections").insert({ company_id, partner_company_id: partner_company_id || null, provider_name, connection_name, auth_type, scopes, base_url: base_url || null, secret_ref: secret_ref || null, metadata }).select("id,company_id,partner_company_id,provider_name,connection_name,auth_type,status,scopes,base_url,metadata,created_at").single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ connection: data });
});

router.get("/connections/:companyId", requireAuth, async (req: AuthedRequest, res) => {
  if (!(await admin(req))) return res.status(403).json({ error: "Partner connection administration required" });
  const { data, error } = await supabaseAdmin.from("company_api_connections").select("id,company_id,partner_company_id,provider_name,connection_name,auth_type,status,scopes,base_url,metadata,created_at,last_used_at,expires_at").eq("company_id", req.params.companyId).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ connections: data || [] });
});

router.get("/private/ping", requireCompanyApiKey, companyApiAudit, requireCompanyScope("company.ping"), async (req: CompanyApiRequest, res) => {
  res.json({ ok: true, company_id: req.companyApi!.companyId, request_id: req.companyApi!.requestId });
});

router.get("/private/context", requireCompanyApiKey, companyApiAudit, requireCompanyScope("company.context.read"), async (req: CompanyApiRequest, res) => {
  const { data: company } = await supabaseAdmin.from("companies").select("company_id,slug,name,industry,status").eq("company_id", req.companyApi!.companyId).maybeSingle();
  if (!company) return res.status(404).json({ error: "Company not found", request_id: req.companyApi!.requestId });
  res.json({ company, request_id: req.companyApi!.requestId });
});

export default router;
