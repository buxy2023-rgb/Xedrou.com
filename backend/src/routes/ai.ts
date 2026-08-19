import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { aiProviderStatus, AiRole, generateAiResponse } from "../services/aiOrchestrator";

const router = Router();

router.get("/providers", requireAuth, (_req, res) => res.json(aiProviderStatus()));

router.post("/orchestrate", requireAuth, async (req: AuthedRequest, res) => {
  const { role, company, task, context, outputFormat } = req.body || {};
  if (!task || typeof task !== "string") return res.status(400).json({ error: "task is required" });
  const allowed: AiRole[] = ["developer", "accounting", "sports", "customer_service", "hr", "governor", "cfo", "creative", "elinit", "general"];
  const selectedRole = allowed.includes(role) ? role : "general";
  try {
    const result = await generateAiResponse({ role: selectedRole, company, task, context, outputFormat });
    res.json(result);
  } catch (error: any) {
    res.status(503).json({ error: error?.message || "AI orchestration failed", providers: aiProviderStatus() });
  }
});

export default router;
