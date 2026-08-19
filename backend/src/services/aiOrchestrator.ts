import Anthropic from "@anthropic-ai/sdk";

export type AiRole = "developer" | "accounting" | "sports" | "customer_service" | "hr" | "governor" | "cfo" | "creative" | "elinit" | "general";

type Provider = "openai" | "anthropic" | "gemini";

const env = (name: string) => process.env[name]?.trim() || "";

const ROLE_INSTRUCTIONS: Record<AiRole, string> = {
  developer: "You are Xedruo Developer AI. Act as a senior software engineer and coding agent. Produce production-ready TypeScript/JavaScript, React, Next.js, SQL, APIs, tests, architecture, debugging steps and secure implementation plans. Prefer precise code and explain assumptions. Never expose secrets.",
  accounting: "You are Xedruo Accounting AI. Act as a professional accounting and finance assistant. Analyze sales, income, expenses, receivables, payables, cash flow and transactions. Never invent figures. Clearly separate actual data from estimates. When requested, produce Excel-compatible CSV layouts and standard PostgreSQL SQL queries, with safe read-only SQL by default.",
  sports: "You are Sportruo Sports AI. Act as a sports analytics specialist. Analyze supplied fixtures, team/player form, injuries, schedules and statistics. Produce probabilistic predictions with confidence ranges, explain the evidence and uncertainty, and never present predictions as guaranteed outcomes.",
  customer_service: "You are Xedruo Customer Service AI. Act as a professional support agent. Classify customer queries, draft accurate replies, identify escalation needs, summarize cases and suggest next actions. Be empathetic, concise and never invent company policies or account facts.",
  hr: "You are Xedruo HR AI. Support recruitment, staff operations, onboarding, workforce analysis, policy drafts and employee communications. Protect sensitive employee information and avoid unsupported employment or legal conclusions.",
  governor: "You are Xedruo Governor AI. Analyze company-wide operations and performance across weekly, monthly and yearly periods. Identify trends, bottlenecks, opportunities and measurable actions across operations, sales and service delivery.",
  cfo: "You are Xedruo CFO AI. Analyze executive finance, cash flow, profitability, budgets, expenses, capital allocation and growth. Never fabricate financial data. Flag assumptions, risks and missing information.",
  creative: "You are Xedruo Creative AI. Create original music and media content, including lyrics, descriptions, metadata, marketing copy and creative concepts. Do not imitate a living artist's exact style. Keep generated lyrics original.",
  elinit: "You are Xedruo Elinit AI, the orchestration layer for the Xedruo AI network. Route each request to the most appropriate specialist perspective, combine useful perspectives when needed, and return one actionable answer. Specialists include developer, accounting, sports, customer service, HR, governor, CFO and creative. State which specialist perspective was used when helpful.",
  general: "You are Xedruo AI, a secure general-purpose business and technology assistant for the Xedruo group. Give practical, accurate and actionable answers.",
};

const PROVIDER_ORDER: Record<AiRole, Provider[]> = {
  developer: ["openai", "anthropic", "gemini"],
  accounting: ["anthropic", "openai", "gemini"],
  sports: ["gemini", "openai", "anthropic"],
  customer_service: ["openai", "anthropic", "gemini"],
  hr: ["anthropic", "openai", "gemini"],
  governor: ["openai", "anthropic", "gemini"],
  cfo: ["openai", "anthropic", "gemini"],
  creative: ["anthropic", "openai", "gemini"],
  elinit: ["openai", "anthropic", "gemini"],
  general: ["openai", "anthropic", "gemini"],
};

function providerModel(provider: Provider, role: AiRole) {
  if (provider === "openai") return env("OPENAI_MODEL") || (role === "developer" ? "gpt-5.6-sol" : "gpt-5.6-terra");
  if (provider === "anthropic") return env("ANTHROPIC_MODEL") || "claude-sonnet-4-6";
  return env("GEMINI_MODEL") || "gemini-2.5-pro";
}

async function callOpenAI(instructions: string, input: string, role: AiRole) {
  const key = env("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const model = providerModel("openai", role);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, instructions, input, store: false }),
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `OpenAI request failed (${response.status})`);
  const text = body.output_text || (body.output || []).flatMap((item: any) => item.content || []).map((item: any) => item.text || "").join("\n");
  if (!text) throw new Error("OpenAI returned no text");
  return { text, provider: "openai" as Provider, model };
}

async function callAnthropic(instructions: string, input: string, role: AiRole) {
  const key = env("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  const client = new Anthropic({ apiKey: key });
  const model = providerModel("anthropic", role);
  const response = await client.messages.create({ model, max_tokens: Number(env("AI_MAX_OUTPUT_TOKENS") || 4000), system: instructions, messages: [{ role: "user", content: input }] });
  const text = response.content.map((block: any) => block.type === "text" ? block.text : "").join("\n").trim();
  if (!text) throw new Error("Anthropic returned no text");
  return { text, provider: "anthropic" as Provider, model };
}

async function callGemini(instructions: string, input: string, role: AiRole) {
  const key = env("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const model = providerModel("gemini", role);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: instructions }] }, contents: [{ role: "user", parts: [{ text: input }] }] }),
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Gemini request failed (${response.status})`);
  const text = (body.candidates || []).flatMap((candidate: any) => candidate.content?.parts || []).map((part: any) => part.text || "").join("\n").trim();
  if (!text) throw new Error("Gemini returned no text");
  return { text, provider: "gemini" as Provider, model };
}

async function callProvider(provider: Provider, instructions: string, input: string, role: AiRole) {
  if (provider === "openai") return callOpenAI(instructions, input, role);
  if (provider === "anthropic") return callAnthropic(instructions, input, role);
  return callGemini(instructions, input, role);
}

export async function generateAiResponse({ role = "general", company, task, context, outputFormat }: { role?: AiRole; company?: string; task: string; context?: string; outputFormat?: "text" | "csv" | "sql" | "json" }) {
  const safeRole = (role in ROLE_INSTRUCTIONS ? role : "general") as AiRole;
  const formatInstruction = outputFormat === "csv"
    ? "Return an Excel-compatible CSV table only, with a header row."
    : outputFormat === "sql"
      ? "Return standard PostgreSQL SQL only. Prefer SELECT/CTE queries unless the user explicitly asks for a write operation."
      : outputFormat === "json"
        ? "Return valid JSON only."
        : "Return clear human-readable text.";
  const instructions = `${ROLE_INSTRUCTIONS[safeRole]}\n\nActive company: ${company || "Xedruo group"}\n${formatInstruction}`;
  const input = [task, context ? `Context:\n${context}` : ""].filter(Boolean).join("\n\n");
  const errors: string[] = [];
  for (const provider of PROVIDER_ORDER[safeRole]) {
    try {
      const result = await callProvider(provider, instructions, input, safeRole);
      return { ...result, role: safeRole, fallbackUsed: errors.length > 0 };
    } catch (error: any) {
      errors.push(`${provider}: ${error?.message || "request failed"}`);
    }
  }
  throw new Error(`No configured AI provider could answer this request. ${errors.join(" | ")}`);
}

export function aiProviderStatus() {
  return {
    openai: { connected: !!env("OPENAI_API_KEY"), model: env("OPENAI_MODEL") || "role-routed default" },
    anthropic: { connected: !!env("ANTHROPIC_API_KEY"), model: env("ANTHROPIC_MODEL") || "claude-sonnet-4-6" },
    gemini: { connected: !!env("GEMINI_API_KEY"), model: env("GEMINI_MODEL") || "gemini-2.5-pro" },
  };
}
