import Anthropic from "@anthropic-ai/sdk";
import { freeAiFallback } from "./freeAiFallback";

export type AiRole = "developer" | "accounting" | "sports" | "customer_service" | "hr" | "governor" | "cfo" | "operations" | "sales" | "marketing" | "procurement" | "legal" | "creative" | "elinit" | "general";
type Provider = "openai" | "anthropic" | "gemini";

export const XEDRUO_APPS = ["pay", "play", "sportruo", "hireuo", "adom", "agruo", "healthruo", "xedruo_education", "xedruo_capital", "xedruo_energy", "xedruo_logistics", "xedruo_properties", "spacetruo", "enit_ai", "xedruo"] as const;

const env = (name: string) => process.env[name]?.trim() || "";

const ROLE_INSTRUCTIONS: Record<AiRole, string> = {
  developer: "You are Xedruo Developer AI. Act as a senior software engineer and coding agent. Produce production-ready TypeScript/JavaScript, React, Next.js, SQL, APIs, tests, architecture, debugging steps and secure implementation plans. Never expose secrets.",
  accounting: "You are Xedruo Accounting AI. Analyze sales, income, expenses, receivables, payables, cash flow and transactions. Never invent figures. Support Excel-compatible CSV and standard PostgreSQL SQL, using read-only SQL by default.",
  sports: "You are Sportruo Sports AI. Analyze supplied fixtures, team/player form, injuries, schedules and statistics. Produce probabilistic predictions with confidence ranges and uncertainty; never guarantee outcomes.",
  customer_service: "You are the customer-support AI for the active Xedruo company. Handle customer questions, complaints, refunds/service issues, case classification, accurate replies and escalation. Use the active company's context and never invent policies, account facts or transaction results.",
  hr: "You are Xedruo HR AI. Support recruitment, staff operations, onboarding, workforce analysis, policy drafts and employee communications while protecting sensitive employee information.",
  governor: "You are Xedruo Governor AI. Analyze weekly, monthly and yearly company operations, sales, service delivery, expenses and performance. Identify trends, bottlenecks and measurable growth actions.",
  cfo: "You are Xedruo CFO AI. Analyze executive finance, cash flow, profitability, budgets, expenses, capital allocation and growth. Clearly flag assumptions and missing information.",
  operations: "You are Xedruo Operations AI. Optimize workflows, capacity, service delivery, inventory, logistics, turnaround time, quality and operational efficiency.",
  sales: "You are Xedruo Sales AI. Analyze leads, customers, conversion, pipeline, revenue opportunities, pricing and sales performance. Produce actionable sales strategies from supplied data.",
  marketing: "You are Xedruo Marketing AI. Develop campaigns, customer segmentation, content, positioning, growth experiments and channel strategy appropriate to the active company.",
  procurement: "You are Xedruo Procurement AI. Support supplier comparison, purchasing analysis, stock planning, procurement workflows and cost optimization. Do not fabricate supplier facts.",
  legal: "You are Xedruo Legal Operations AI. Help organize contracts, policies, compliance checklists and legal-operation workflows. Do not present unsupported output as legal advice.",
  creative: "You are Xedruo Creative AI. Create original music, media, marketing copy, descriptions, metadata and creative concepts. Do not imitate a living artist's exact style.",
  elinit: "You are Enit AI, the central Xedruo intelligence layer. Coordinate specialist AIs, route requests to the right function and company context, combine specialist perspectives when needed and return one actionable answer.",
  general: "You are Xedruo AI, a secure general-purpose business and technology assistant for the Xedruo group."
};

const PROVIDER_ORDER: Record<AiRole, Provider[]> = {
  developer: ["openai", "anthropic", "gemini"], accounting: ["anthropic", "openai", "gemini"], sports: ["gemini", "openai", "anthropic"], customer_service: ["openai", "anthropic", "gemini"], hr: ["anthropic", "openai", "gemini"], governor: ["openai", "anthropic", "gemini"], cfo: ["openai", "anthropic", "gemini"], operations: ["openai", "anthropic", "gemini"], sales: ["openai", "anthropic", "gemini"], marketing: ["anthropic", "openai", "gemini"], procurement: ["openai", "anthropic", "gemini"], legal: ["anthropic", "openai", "gemini"], creative: ["anthropic", "openai", "gemini"], elinit: ["openai", "anthropic", "gemini"], general: ["openai", "anthropic", "gemini"]
};

function providerModel(provider: Provider, role: AiRole) {
  if (provider === "openai") return env("OPENAI_MODEL") || (role === "developer" ? "gpt-5.6-sol" : "gpt-5.6-terra");
  if (provider === "anthropic") return env("ANTHROPIC_MODEL") || "claude-sonnet-4-6";
  return env("GEMINI_MODEL") || "gemini-2.5-pro";
}

async function callOpenAI(instructions: string, input: string, role: AiRole) {
  const key = env("OPENAI_API_KEY"); if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const model = providerModel("openai", role);
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, instructions, input, store: false }) });
  const body: any = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body?.error?.message || `OpenAI request failed (${response.status})`);
  const text = body.output_text || (body.output || []).flatMap((item: any) => item.content || []).map((item: any) => item.text || "").join("\n"); if (!text) throw new Error("OpenAI returned no text"); return { text, provider: "openai" as Provider, model };
}
async function callAnthropic(instructions: string, input: string, role: AiRole) {
  const key = env("ANTHROPIC_API_KEY"); if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  const client = new Anthropic({ apiKey: key }); const model = providerModel("anthropic", role);
  const response = await client.messages.create({ model, max_tokens: Number(env("AI_MAX_OUTPUT_TOKENS") || 4000), system: instructions, messages: [{ role: "user", content: input }] });
  const text = response.content.map((block: any) => block.type === "text" ? block.text : "").join("\n").trim(); if (!text) throw new Error("Anthropic returned no text"); return { text, provider: "anthropic" as Provider, model };
}
async function callGemini(instructions: string, input: string, role: AiRole) {
  const key = env("GEMINI_API_KEY"); if (!key) throw new Error("GEMINI_API_KEY is not configured");
  const model = providerModel("gemini", role);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: instructions }] }, contents: [{ role: "user", parts: [{ text: input }] }] }) });
  const body: any = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body?.error?.message || `Gemini request failed (${response.status})`);
  const text = (body.candidates || []).flatMap((candidate: any) => candidate.content?.parts || []).map((part: any) => part.text || "").join("\n").trim(); if (!text) throw new Error("Gemini returned no text"); return { text, provider: "gemini" as Provider, model };
}
async function callProvider(provider: Provider, instructions: string, input: string, role: AiRole) { if (provider === "openai") return callOpenAI(instructions, input, role); if (provider === "anthropic") return callAnthropic(instructions, input, role); return callGemini(instructions, input, role); }

const COMPANY_SPECIALTIES: Record<string, string> = {
  pay: "Pay: payments and financial services. Customer AI handles payment questions, failed transactions, refunds and service escalation.", play: "Play: entertainment/play services. Customer AI handles service questions, account issues and complaints.", sportruo: "Sportruo: sports platform. Sports AI handles analytics and probabilistic predictions; customer AI handles user support.", hireuo: "Hireuo: employment platform. Hireuo AI supports CV analysis/revamping, job matching, candidate-employer matching and interview preparation; customer AI handles support.", adom: "Adom: company-specific operations and customer service AI.", agruo: "Agruo: agriculture-focused operations, sales, customer service and analytics AI.", healthruo: "Healthruo: health-service operations and customer support AI; avoid unsupported medical diagnosis.", xedruo_education: "Xedruo Education: education operations, learner support and academic assistance AI.", xedruo_capital: "Xedruo Capital: investment, finance, portfolio and customer-support AI; distinguish analysis from financial advice.", xedruo_energy: "Xedruo Energy: energy operations, service, sales and performance AI.", xedruo_logistics: "Xedruo Logistics: routing, delivery, operations, sales and customer-support AI.", xedruo_properties: "Xedruo Properties: property operations, listings, sales/leasing and customer-support AI.", spacetruo: "Spacetruo: space/project operations, customer service and growth AI.", enit_ai: "Enit AI: central AI orchestration and cross-company intelligence.", xedruo: "Xedruo: parent platform, executive intelligence, governance and cross-company orchestration."
};

export async function generateAiResponse({ role = "general", company, task, context, outputFormat }: { role?: AiRole; company?: string; task: string; context?: string; outputFormat?: "text" | "csv" | "sql" | "json" }) {
  const safeRole = (role in ROLE_INSTRUCTIONS ? role : "general") as AiRole;
  const companyKey = String(company || "xedruo").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const companyInstruction = COMPANY_SPECIALTIES[companyKey] || `Active company: ${company || "Xedruo group"}. Apply the active company's own customer-support and operational context.`;
  const formatInstruction = outputFormat === "csv" ? "Return an Excel-compatible CSV table only, with a header row." : outputFormat === "sql" ? "Return standard PostgreSQL SQL only; prefer read-only SELECT/CTE queries unless a write is explicitly requested." : outputFormat === "json" ? "Return valid JSON only." : "Return clear human-readable text.";
  const instructions = `${ROLE_INSTRUCTIONS[safeRole]}\n\n${companyInstruction}\n${formatInstruction}`;
  const input = [task, context ? `Context:\n${context}` : ""].filter(Boolean).join("\n\n");
  const errors: string[] = [];
  for (const provider of PROVIDER_ORDER[safeRole]) {
    try {
      const result = await callProvider(provider, instructions, input, safeRole);
      return { ...result, role: safeRole, company: companyKey, mode: "provider", fallbackUsed: errors.length > 0 };
    } catch (error: any) {
      errors.push(`${provider}: ${error?.message || "request failed"}`);
    }
  }

  // Free-first policy: Xedruo remains usable even when no paid AI provider is configured.
  return {
    text: freeAiFallback({ role: safeRole, company: companyKey, task: input, outputFormat }),
    provider: "xedruo-free",
    model: "free-fallback",
    role: safeRole,
    company: companyKey,
    mode: "free",
    fallbackUsed: true,
    providerErrors: errors,
  };
}

export function aiProviderStatus() {
  return {
    free: { connected: true, model: "xedruo-free-fallback", cost: 0 },
    openai: { connected: !!env("OPENAI_API_KEY"), model: env("OPENAI_MODEL") || "role-routed default" },
    anthropic: { connected: !!env("ANTHROPIC_API_KEY"), model: env("ANTHROPIC_MODEL") || "claude-sonnet-4-6" },
    gemini: { connected: !!env("GEMINI_API_KEY"), model: env("GEMINI_MODEL") || "gemini-2.5-pro" },
  };
}
