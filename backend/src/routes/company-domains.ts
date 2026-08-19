import { Router } from "express";
import crypto from "crypto";
import { supabaseAdmin } from "../config/supabase";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);
const normalize = (value: string) => value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");

router.get("/", async (req: AuthedRequest, res) => {
  const companyId = String(req.query.company_id || "");
  if (!companyId) return res.status(400).json({ error: "company_id is required" });
  const { data, error } = await supabaseAdmin.from("company_domains").select("id,company_id,project_id,domain,is_primary,status,verification_method,verified_at,created_at,updated_at").eq("company_id", companyId).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ domains: data || [] });
});

router.post("/", async (req: AuthedRequest, res) => {
  const { company_id, project_id, domain, domain_type = "custom" } = req.body || {};
  const normalized = normalize(String(domain || ""));
  if (!company_id || !normalized || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(normalized)) return res.status(400).json({ error: "A valid domain is required" });
  const token = `xedruo-domain-${crypto.randomBytes(18).toString("hex")}`;
  const { data, error } = await supabaseAdmin.from("company_domains").insert({ company_id, project_id: project_id || null, domain: normalized, normalized_domain: normalized, domain_type, status: "pending", verification_token: token, verification_method: "dns_txt", created_by: req.user!.id }).select("id,company_id,project_id,domain,status,verification_method,created_at").single();
  if (error) return res.status(error.code === "23505" ? 409 : 500).json({ error: error.code === "23505" ? "Domain is already registered" : error.message });
  res.status(201).json({ domain: data, dns: { type: "TXT", name: `_xedruo.${normalized}`, value: token } });
});

router.post("/:id/verify", async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { data: record, error: readError } = await supabaseAdmin.from("company_domains").select("id,domain,verification_token,status").eq("id", id).single();
  if (readError || !record) return res.status(404).json({ error: "Domain not found" });
  const dns = await import("dns/promises");
  try {
    const values = await dns.resolveTxt(`_xedruo.${record.domain}`);
    const flattened = values.flat().map(String);
    if (!flattened.includes(record.verification_token)) return res.status(409).json({ error: "DNS verification record not found", status: "pending" });
  } catch { return res.status(409).json({ error: "DNS verification record not found", status: "pending" }); }
  const { data, error } = await supabaseAdmin.from("company_domains").update({ status: "verified", verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).select("id,domain,status,verified_at").single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ domain: data });
});

export default router;
