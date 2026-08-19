import { Router } from "express";
import crypto from "crypto";
import { promises as dns } from "dns";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();
const PROVIDERS = [
  { slug: "cloudflare", name: "Cloudflare", url: "https://www.cloudflare.com/products/registrar/" },
  { slug: "namecheap", name: "Namecheap", url: "https://www.namecheap.com/domains/" },
  { slug: "godaddy", name: "GoDaddy", url: "https://www.godaddy.com/domains" },
  { slug: "porkbun", name: "Porkbun", url: "https://porkbun.com/" },
];

async function developer(req: AuthedRequest) {
  const { data } = await supabaseAdmin.from("profiles").select("role,is_active").eq("id", req.user!.id).maybeSingle();
  if (!data?.is_active || !["admin", "developer"].includes(data.role)) throw Object.assign(new Error("Developer access required"), { status: 403 });
  return data;
}
function normalize(domain: string) { return domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, "www."); }
function validDomain(domain: string) { return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain); }

router.get("/providers", requireAuth, async (req: AuthedRequest, res) => {
  try { await developer(req); res.json({ providers: PROVIDERS }); } catch (e: any) { res.status(e.status || 500).json({ error: e.message }); }
});

router.get("/projects/:projectId/domains", requireAuth, async (req: AuthedRequest, res) => {
  try {
    await developer(req);
    const { data, error } = await supabaseAdmin.from("company_domains").select("id,company_id,project_id,domain,is_primary,status,verification_method,verified_at,created_at,updated_at").eq("project_id", req.params.projectId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    res.json({ domains: data || [] });
  } catch (e: any) { res.status(e.status || 500).json({ error: e.message }); }
});

router.post("/projects/:projectId/domains", requireAuth, async (req: AuthedRequest, res) => {
  try {
    await developer(req);
    const projectId = req.params.projectId;
    const domain = normalize(String(req.body?.domain || ""));
    if (!validDomain(domain)) return res.status(400).json({ error: "Enter a valid domain such as example.com" });
    const { data: project } = await supabaseAdmin.from("developer_projects").select("id,company_id,name").eq("id", projectId).maybeSingle();
    if (!project) return res.status(404).json({ error: "Project not found" });
    const token = `xedruo-domain-${crypto.randomBytes(18).toString("hex")}`;
    const { data, error } = await supabaseAdmin.from("company_domains").insert({ company_id: project.company_id, project_id: projectId, domain, normalized_domain: domain, domain_type: domain.startsWith("www.") ? "www" : "apex", status: "pending", verification_token: token, verification_method: "dns_txt", created_by: req.user!.id }).select("id,company_id,project_id,domain,status,verification_method,verification_token,created_at").single();
    if (error) throw new Error(error.message);
    res.status(201).json({ domain: data, dns: { type: "TXT", name: "_xedruo", value: token } });
  } catch (e: any) { res.status(e.status || 500).json({ error: e.message }); }
});

router.post("/domains/:id/verify", requireAuth, async (req: AuthedRequest, res) => {
  try {
    await developer(req);
    const { data: row } = await supabaseAdmin.from("company_domains").select("id,domain,verification_token,status,project_id").eq("id", req.params.id).maybeSingle();
    if (!row) return res.status(404).json({ error: "Domain not found" });
    const records = await dns.resolveTxt(`_xedruo.${row.domain}`);
    const found = records.flat().some(value => value === row.verification_token);
    if (!found) {
      await supabaseAdmin.from("company_domains").update({ status: "verifying", updated_at: new Date().toISOString() }).eq("id", row.id);
      return res.status(409).json({ verified: false, error: "Verification record not found yet. DNS can take a few minutes to propagate.", dns: { type: "TXT", name: "_xedruo", value: row.verification_token } });
    }
    await supabaseAdmin.from("company_domains").update({ status: "verified", verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", row.id);
    res.json({ verified: true, status: "verified" });
  } catch (e: any) { res.status(e.status || 500).json({ error: e.code === "ENOTFOUND" ? "DNS record not found yet" : e.message }); }
});

router.post("/domains/:id/activate", requireAuth, async (req: AuthedRequest, res) => {
  try {
    await developer(req);
    const { data: row } = await supabaseAdmin.from("company_domains").select("id,domain,status,project_id,company_id").eq("id", req.params.id).maybeSingle();
    if (!row) return res.status(404).json({ error: "Domain not found" });
    if (row.status !== "verified" && row.status !== "active") return res.status(409).json({ error: "Verify domain ownership first" });
    const { data: project } = await supabaseAdmin.from("developer_projects").select("specification").eq("id", row.project_id).maybeSingle();
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = (project?.specification as any)?.vercelProjectId || process.env.VERCEL_PROJECT_ID;
    if (!vercelToken || !vercelProjectId) return res.status(503).json({ error: "Domain verified. Vercel deployment connection is not configured yet." });
    const response = await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(vercelProjectId)}/domains`, { method: "POST", headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: row.domain }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 409) return res.status(response.status).json({ error: payload?.error?.message || "Vercel could not attach the domain" });
    await supabaseAdmin.from("company_domains").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", row.id);
    res.json({ active: true, domain: row.domain, vercel: payload });
  } catch (e: any) { res.status(e.status || 500).json({ error: e.message }); }
});

export default router;
