import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

const COMPANY_AI_PROFILES: Record<string, string> = {
  "pay": "Payments/financial-services AI: help customers with payment questions, transaction status, failed payments, refunds and escalation; never fabricate transaction facts.",
  "play": "Entertainment/play AI: help customers with product, content, account and service questions, recommend appropriate offerings, and escalate safety or account issues.",
  "hireruo": "Recruitment AI: match candidates to jobs, compare skills to requirements, identify gaps, improve CVs, tailor CVs to jobs, prepare candidates for interviews, and help employers improve job descriptions. Do not make protected-class hiring decisions or invent qualifications.",
  "sportruo": "Sports intelligence AI: explain performance, statistics, fixtures and forecasts; clearly label predictions as probabilistic and never guarantee outcomes.",
};

const SYSTEM = `You are Xedruo Company AI, the private AI network for Xedruo Power Holdings and every operating company in Xedruo. Every company gets its own customer-support AI plus a specialist business AI. Current company portfolio includes Xedruo, Sportruo, Hireruo, Adom, Agruo, Heathrou, Xedruo Education, Xedruo Capital, Xedruo Energy, Xedruo Logistics, Xedruo Properties, Spacetruo, Xedruo AI, Pay and Play. Act as a company-aware chief-of-staff, strategist, product architect, operations analyst, customer-support assistant and technical co-pilot. Keep company information private. Never invent financial, transaction, customer, employee, job or operational facts; label estimates and assumptions. Customer complaints should be handled empathetically, with clear next actions and escalation when needed. When asked to build something, give concrete specifications, dependencies, risks, milestones and next actions.`;

router.get("/memory", requireAuth, async (req: AuthedRequest, res) => {
  const company = String(req.query.company || "xedruo-power-holdings");
  const { data, error } = await supabaseAdmin.from("company_ai_memory").select("id,company_slug,role,content,created_at").eq("user_id", req.user!.id).eq("company_slug", company).order("created_at", { ascending: true }).limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ messages: data || [], profile: COMPANY_AI_PROFILES[company] || "General company customer-support and operations AI." });
});

router.post("/chat", requireAuth, async (req: AuthedRequest, res) => {
  if (!anthropic) return res.status(503).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
  const { company, companyType, userMessage, mode = "company" } = req.body || {};
  if (!company || !userMessage || typeof userMessage !== "string") return res.status(400).json({ error: "company and userMessage are required" });
  try {
    const { data: history } = await supabaseAdmin.from("company_ai_memory").select("role,content").eq("user_id", req.user!.id).eq("company_slug", company).order("created_at", { ascending: false }).limit(20);
    const context = [...(history || [])].reverse().map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
    await supabaseAdmin.from("company_ai_memory").insert({ user_id: req.user!.id, company_slug: company, role: "user", content: userMessage });
    const profile = COMPANY_AI_PROFILES[company] || "General customer-support and operations AI for this company.";
    const message = await anthropic.messages.create({ model: "claude-sonnet-4-6", max_tokens: 1800, system: `${SYSTEM}\n\nActive company: ${company}\nCompany type: ${companyType || "Operating company"}\nAI profile: ${profile}\nMode: ${mode}`, messages: [...context, { role: "user", content: userMessage }] });
    const answer = message.content.map((block: any) => block.type === "text" ? block.text : "").join("\n");
    await supabaseAdmin.from("company_ai_memory").insert({ user_id: req.user!.id, company_slug: company, role: "assistant", content: answer });
    res.json({ answer, company, mode });
  } catch (err: any) { res.status(502).json({ error: err.message || "Company AI request failed" }); }
});

router.delete("/memory", requireAuth, async (req: AuthedRequest, res) => {
  const company = String(req.query.company || "xedruo-power-holdings");
  const { error } = await supabaseAdmin.from("company_ai_memory").delete().eq("user_id", req.user!.id).eq("company_slug", company);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
