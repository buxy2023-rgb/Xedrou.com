import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

const SYSTEM = `You are Xedruo Company AI, the private strategic AI for Xedruo Power Holdings and its 13 operating companies: Xedruo, Sportruo, Hireruo, Adom, Agruo, Heathrou, Xedruo Education, Xedruo Capital, Xedruo Energy, Xedruo Logistics, Xedruo Properties, Spacetruo and Xedruo AI. Act as chief-of-staff, strategist, product architect, operations analyst and technical co-pilot. Keep company information private. Never invent financial facts; label estimates and assumptions. When asked to build something, give concrete specifications, dependencies, risks, milestones and next actions.`;

router.get("/memory", requireAuth, async (req: AuthedRequest, res) => {
  const company = String(req.query.company || "xedruo-power-holdings");
  const { data, error } = await supabaseAdmin.from("company_ai_memory").select("id,company_slug,role,content,created_at").eq("user_id", req.user!.id).eq("company_slug", company).order("created_at", { ascending: true }).limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ messages: data || [] });
});

router.post("/chat", requireAuth, async (req: AuthedRequest, res) => {
  if (!anthropic) return res.status(503).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
  const { company, companyType, userMessage } = req.body || {};
  if (!company || !userMessage || typeof userMessage !== "string") return res.status(400).json({ error: "company and userMessage are required" });

  try {
    const { data: history } = await supabaseAdmin.from("company_ai_memory").select("role,content").eq("user_id", req.user!.id).eq("company_slug", company).order("created_at", { ascending: false }).limit(20);
    const context = [...(history || [])].reverse().map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
    await supabaseAdmin.from("company_ai_memory").insert({ user_id: req.user!.id, company_slug: company, role: "user", content: userMessage });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1800,
      system: `${SYSTEM}\n\nActive company: ${company}\nCompany type: ${companyType || "Operating company"}`,
      messages: [...context, { role: "user", content: userMessage }],
    });
    const answer = message.content.map((block: any) => block.type === "text" ? block.text : "").join("\n");
    await supabaseAdmin.from("company_ai_memory").insert({ user_id: req.user!.id, company_slug: company, role: "assistant", content: answer });
    res.json({ answer });
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Company AI request failed" });
  }
});

router.delete("/memory", requireAuth, async (req: AuthedRequest, res) => {
  const company = String(req.query.company || "xedruo-power-holdings");
  const { error } = await supabaseAdmin.from("company_ai_memory").delete().eq("user_id", req.user!.id).eq("company_slug", company);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
