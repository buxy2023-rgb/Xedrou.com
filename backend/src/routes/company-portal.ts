import { Router } from "express";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

const COMPANY_SLUGS = new Set([
  "xedruo-power-holdings","xedruo","sportruo","hireruo","adom","agruo","heathrou","xedruo-education","xedruo-capital","xedruo-energy","xedruo-logistics","xedruo-properties","spacetruo","xedruo-ai"
]);

async function profile(req: AuthedRequest) {
  const { data } = await supabaseAdmin.from("profiles").select("id,email,full_name,role,company_slug,job_role,is_active").eq("id", req.user!.id).maybeSingle();
  return data;
}

function allowedCompany(p: any, company: string) {
  return !!p && p.is_active && COMPANY_SLUGS.has(company) && (p.role === "admin" || p.company_slug === company);
}

router.get("/context", requireAuth, async (req: AuthedRequest, res) => {
  const p = await profile(req);
  if (!p) return res.status(403).json({ error: "Workforce profile not configured" });
  res.json({ profile: p, companies: Array.from(COMPANY_SLUGS) });
});

router.get("/site-pages", requireAuth, async (req: AuthedRequest, res) => {
  const company = String(req.query.company || "");
  const p = await profile(req);
  if (!allowedCompany(p, company) || !["admin","developer"].includes(p.role)) return res.status(403).json({ error: "Developer access required" });
  const { data, error } = await supabaseAdmin.from("company_site_pages").select("*").eq("company_slug", company).order("updated_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ pages: data || [] });
});

router.post("/site-pages", requireAuth, async (req: AuthedRequest, res) => {
  const { company, slug, title, content, published } = req.body || {};
  const p = await profile(req);
  if (!allowedCompany(p, company) || !["admin","developer"].includes(p.role)) return res.status(403).json({ error: "Developer access required" });
  if (!slug || !title) return res.status(400).json({ error: "slug and title are required" });
  const { data, error } = await supabaseAdmin.from("company_site_pages").upsert({ company_slug: company, slug, title, content: content || {}, published: !!published, updated_by: req.user!.id, updated_at: new Date().toISOString() }, { onConflict: "company_slug,slug" }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get("/queries", requireAuth, async (req: AuthedRequest, res) => {
  const company = String(req.query.company || "");
  const p = await profile(req);
  if (!allowedCompany(p, company) || !["admin","customer_service"].includes(p.role)) return res.status(403).json({ error: "Customer service access required" });
  const { data, error } = await supabaseAdmin.from("customer_service_queries").select("*").eq("company_slug", company).order("created_at", { ascending: false }).limit(200);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ queries: data || [] });
});

router.patch("/queries/:id", requireAuth, async (req: AuthedRequest, res) => {
  const p = await profile(req);
  const { data: existing } = await supabaseAdmin.from("customer_service_queries").select("*").eq("id", req.params.id).maybeSingle();
  if (!existing || !allowedCompany(p, existing.company_slug) || !["admin","customer_service"].includes(p?.role)) return res.status(403).json({ error: "Customer service access required" });
  const status = ["open","in_progress","resolved","closed"].includes(req.body?.status) ? req.body.status : existing.status;
  const { data, error } = await supabaseAdmin.from("customer_service_queries").update({ status, assigned_to: req.user!.id, updated_at: new Date().toISOString() }).eq("id", req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get("/financials", requireAuth, async (req: AuthedRequest, res) => {
  const company = String(req.query.company || "");
  const p = await profile(req);
  if (!allowedCompany(p, company) || !["admin","accountant"].includes(p.role)) return res.status(403).json({ error: "Accountant access required" });
  const { data, error } = await supabaseAdmin.from("company_ledger_entries").select("entry_date,account,description,income,expense,currency").eq("company_slug", company).order("entry_date", { ascending: false }).limit(1000);
  if (error) return res.status(500).json({ error: error.message });
  const rows = data || [];
  const income = rows.reduce((s: number, r: any) => s + Number(r.income || 0), 0);
  const expenses = rows.reduce((s: number, r: any) => s + Number(r.expense || 0), 0);
  res.json({ company, rows, income, expenses, net_income: income - expenses, currency: rows[0]?.currency || "USD" });
});

export default router;
