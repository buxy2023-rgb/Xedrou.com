import { Router } from "express";
import multer from "multer";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { aiProviderStatus, AiRole, generateAiResponse } from "../services/aiOrchestrator";
import { analyzeSpreadsheetText } from "../services/spreadsheetAnalyzer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.get("/providers", requireAuth, (_req, res) => res.json(aiProviderStatus()));

router.post("/orchestrate", requireAuth, async (req: AuthedRequest, res) => {
  const { role, company, task, context, outputFormat } = req.body || {};
  if (!task || typeof task !== "string") return res.status(400).json({ error: "task is required" });
  const allowed: AiRole[] = ["developer", "accounting", "sports", "customer_service", "hr", "governor", "cfo", "operations", "sales", "marketing", "procurement", "legal", "creative", "elinit", "general"];
  const selectedRole = allowed.includes(role) ? role : "general";
  try { res.json(await generateAiResponse({ role: selectedRole, company, task, context, outputFormat })); }
  catch (error: any) { res.status(503).json({ error: error?.message || "AI orchestration failed", providers: aiProviderStatus() }); }
});

// Excel-compatible spreadsheet workspace. CSV/TSV analysis does not require an AI API.
router.post("/spreadsheet/analyze", requireAuth, upload.single("file"), async (req: AuthedRequest, res) => {
  try {
    const raw = req.file?.buffer?.toString("utf8") || String(req.body?.csv || req.body?.text || "");
    if (!raw.trim()) return res.status(400).json({ error: "Upload a CSV/TSV spreadsheet or provide csv text" });
    const delimiter = String(req.body?.delimiter || "") || (req.file?.originalname?.toLowerCase().endsWith(".tsv") ? "\t" : ",");
    const analysis = analyzeSpreadsheetText(raw, delimiter);
    res.json({ ok: true, engine: "xedruo-spreadsheet", cost: 0, ...analysis });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Spreadsheet analysis failed" });
  }
});

// Enit AI is the public multi-modal AI workspace. Provider keys stay server-side.
router.post("/enit", async (req, res) => {
  const { mode = "chat", prompt, context, outputFormat = "text" } = req.body || {};
  if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "prompt is required" });
  const modes: Record<string, { role: AiRole; instruction: string }> = {
    chat: { role: "general", instruction: "Act as Enit AI public chat. Answer the user's request directly and clearly." },
    build: { role: "developer", instruction: "Act as Enit AI App Builder. Design a real working application from the request. Return architecture, pages, data model, API plan, implementation steps, suggested file tree and starter code where useful. Make the plan executable by the Xedruo Developer Build Agent." },
    analyze: { role: "general", instruction: "Act as Enit AI Data Analyst. Analyze the supplied dataset or text, identify trends, anomalies, useful metrics, recommended charts and decisions. Never invent missing values. If a spreadsheet is supplied, use its actual values." },
    presentation: { role: "creative", instruction: "Act as Enit AI Presentation Builder. Turn the request into a professional presentation plan with title, slide-by-slide content, speaker notes, visuals and a clear narrative." },
    prompt: { role: "elinit", instruction: "Act as Enit AI Prompt Engineer. Transform the user's natural-language request into a high-quality structured prompt/workflow that another AI or Xedruo tool can execute." },
    image: { role: "creative", instruction: "Act as Enit AI visual creative director. Produce a detailed image/artwork generation brief including composition, subject, typography, dimensions and negative constraints." },
    audio: { role: "creative", instruction: "Act as Enit AI audio director. Produce a production-ready audio/voice brief, narration script, sound direction and generation/editing workflow." },
    video: { role: "creative", instruction: "Act as Enit AI video director. Produce a production-ready video concept, script, scene plan, narration, captions and generation/editing workflow." },
    document: { role: "general", instruction: "Act as Enit AI document workspace. Create or transform the requested document with a professional structure and useful formatting." }
  };
  const selected = modes[String(mode)] || modes.chat;
  try {
    const result = await generateAiResponse({ role: selected.role, company: "enit_ai", task: `${selected.instruction}\n\nUser request:\n${prompt}`, context, outputFormat });
    res.json({ ...result, enit: true, mode: String(mode) });
  } catch (error: any) { res.status(503).json({ error: error?.message || "Enit AI is temporarily unavailable", providers: aiProviderStatus() }); }
});

export default router;
