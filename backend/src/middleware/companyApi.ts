import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { supabaseAdmin } from "../config/supabase";

export interface CompanyApiRequest extends Request {
  companyApi?: { keyId: string; companyId: string; scopes: string[]; requestId: string };
}

function bearer(req: Request) {
  const value = req.header("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() : null;
}

function hashKey(key: string) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function requireCompanyApiKey(req: CompanyApiRequest, res: Response, next: NextFunction) {
  const requestId = crypto.randomUUID();
  res.setHeader("X-Xedruo-Request-Id", requestId);
  const key = bearer(req);
  if (!key || key.length < 24) return res.status(401).json({ error: "Company API authentication required", requestId });

  const { data, error } = await supabaseAdmin
    .from("company_api_keys")
    .select("id,company_id,scopes,status,expires_at")
    .eq("key_hash", hashKey(key))
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return res.status(401).json({ error: "Invalid company API key", requestId });
  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return res.status(401).json({ error: "Company API key expired", requestId });

  const { data: company } = await supabaseAdmin.from("companies").select("company_id,status").eq("company_id", data.company_id).maybeSingle();
  if (!company || company.status === "inactive" || company.status === "suspended") return res.status(403).json({ error: "Company API is unavailable", requestId });

  req.companyApi = { keyId: data.id, companyId: data.company_id, scopes: data.scopes || [], requestId };
  await supabaseAdmin.from("company_api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  next();
}

export function requireCompanyScope(scope: string) {
  return (req: CompanyApiRequest, res: Response, next: NextFunction) => {
    if (!req.companyApi?.scopes.includes(scope)) return res.status(403).json({ error: "API scope not granted", required_scope: scope, requestId: req.companyApi?.requestId });
    next();
  };
}

export async function companyApiAudit(req: CompanyApiRequest, res: Response, next: NextFunction) {
  res.on("finish", async () => {
    if (!req.companyApi) return;
    await supabaseAdmin.from("company_api_audit_log").insert({
      company_id: req.companyApi.companyId,
      actor_user_id: null,
      event_type: "api_request",
      resource: req.path,
      action: req.method,
      request_id: req.companyApi.requestId,
      ip_address: req.ip,
      user_agent: req.get("user-agent") || null,
      status_code: res.statusCode,
      metadata: { keyId: req.companyApi.keyId },
    });
  });
  next();
}
