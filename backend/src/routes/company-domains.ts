import { Router } from "express";
import crypto from "crypto";
import { supabaseAdmin } from "../config/supabase";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);
const normalize = (value: string) => value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
const valid = (value: string) => /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value);
const PROVIDERS = [
  { slug: "cloudflare", name: "Cloudflare", url: "https://www.cloudflare.com/products/registrar/" },
  { slug: "namecheap", name: "Namecheap", url: "https://www.namecheap.com/domains/" },
  { slug: "godaddy", name: "GoDaddy", url: "https://www.godaddy.com/domains" },
  { slug: "porkbun", name: "Porkbun", url: "https://porkbun.com/" },
];
async function canManage(req: AuthedRequest) { const { data } = await supabaseAdmin.from("profiles").select("role,is_active").eq("id", req.user!.id).maybeSingle(); return !!data?.is_active && ["admin", "developer"].includes(data.role); }

router.get("/providers", async (_req, res) => res.json({ providers: PROVIDERS }));

router.get("/", async (req: AuthedRequest, res) => {
  if (!(await canManage(req))) return res.status(403).json({ error: "Developer access required" });
  const companyId = String(req.query.company_id || "");
  const projectId = String(req.query.project_id || "");
  if (!companyId && !projectId) return res.status(400).json({ error: "company_id or project_id is required" });
  let query = supabaseAdmin.from("company_domains").select("id,company_id,project_id,domain,is_primary,status,verification_method,verified_at,created_at,updated_at").order("created_at", { ascending: false });
  query = projectId ? query.eq("project_id", projectId) : query.eq("company_id", companyId);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ domains: data || [], providers: PROVIDERS });
});

router.post("/", async (req: AuthedRequest, res) => {
  if (!(await canManage(req))) return res.status(403).json({ error: "Developer access required" });
  const { company_id, project_id, domain, domain_type = "custom" } = req.body || {};
  const normalized = normalize(String(domain || ""));
  if (!company_id || !normalized || !valid(normalized)) return res.status(400).json({ error: "A valid domain is required" });
  const token = `xedruo-domain-${crypto.randomBytes(18).toString("hex")}`;
  const { data, error } = await supabaseAdmin.from("company_domains").insert({ company_id, project_id: project_id || null, domain: normalized, normalized_domain: normalized, domain_type, status: "pending", verification_token: token, verification_method: "dns_txt", created_by: req.user!.id }).select("id,company_id,project_id,domain,status,verification_method,created_at").single();
  if (error) return res.status(error.code === "23505" ? 409 : 500).json({ error: error.code === "23505" ? "Domain is already registered" : error.message });
  res.status(201).json({ domain: data, dns: { type: "TXT", name: `_xedruo.${normalized}`, value: token } });
});

router.post("/:id/verify", async (req: AuthedRequest, res) => {
  if (!(await canManage(req))) return res.status(403).json({ error: "Developer access required" });
  const { id } = req.params;
  const { data: record, error: readError } = await supabaseAdmin.from("company_domains").select("id,domain,verification_token,status").eq("id", id).single();
  if (readError || !record) return res.status(404).json({ error: "Domain not found" });
  const dns = await import("dns/promises");
  try {
    const values = await dns.resolveTxt(`_xedruo.${record.domain}`);
    if (!values.flat().map(String).includes(record.verification_token)) return res.status(409).json({ error: "DNS verification record not found yet", status: "pending" });
  } catch { return res.status(409).json({ error: "DNS verification record not found yet", status: "pending" }); }
  const { data, error } = await supabaseAdmin.from("company_domains").update({ status: "verified", verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select("id,domain,status,verified_at").single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ domain: data });
});

router.post("/:id/activate", async (req: AuthedRequest, res) => {
  if (!(await canManage(req))) return res.status(403).json({ error: "Developer access required" });
  const { data: record } = await supabaseAdmin.from("company_domains").select("id,domain,status,project_id").eq("id", req.params.id).single();
  if (!record) return res.status(404).json({ error: "Domain not found" });
  if (record.status !== "verified" && record.status !== "active") return res.status(409).json({ error: "Verify domain ownership first" });
  const { data: project } = await supabaseAdmin.from("developer_projects").select("specification").eq("id", record.project_id).maybeSingle();
  const token = process.env.VERCEL_TOKEN;
  const projectId = (project?.specification as any)?.vercelProjectId || process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return res.status(503).json({ error: "Domain is verified. Xedruo still needs its Vercel deployment connection configured before it can activate the live domain." });
  const response = await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/domains`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: record.domain }) });
  const payload: any = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 409) return res.status(response.status).json({ error: payload?.error?.message || "Could not activate domain" });
  await supabaseAdmin.from("company_domains").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", record.id);
  res.json({ active: true, domain: record.domain });
});

export default router;
