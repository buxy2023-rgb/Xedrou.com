import type { AiRole } from "./aiOrchestrator";

/**
 * Zero-cost fallback used when no paid AI provider is configured.
 * It deliberately does not claim to be a hosted foundation model.
 * It gives users useful structured assistance and keeps the Xedruo AI layer available.
 */
export function freeAiFallback({ role, company, task, outputFormat }: { role: AiRole; company?: string; task: string; outputFormat?: string }) {
  const clean = task.trim();
  const companyName = company || "Xedruo";
  const lower = clean.toLowerCase();
  const sections: string[] = [];

  if (role === "developer") {
    sections.push("## Xedruo Free Developer AI");
    sections.push("**Objective**\n" + clean);
    sections.push("**Implementation approach**\n1. Define the user flow and acceptance criteria.\n2. Identify frontend screens and reusable components.\n3. Define the database entities, relationships and permissions.\n4. Define API endpoints and validation.\n5. Implement authentication and authorization.\n6. Add tests, error handling and logging.\n7. Verify the feature before release.");
    sections.push("**Security checklist**\n- Keep secrets server-side.\n- Validate all user input.\n- Enforce role/company permissions.\n- Use least-privilege database access.\n- Never expose private keys in frontend code.");
  } else if (role === "accounting" || role === "cfo" || role === "governor") {
    sections.push(`## Xedruo Free ${role === "cfo" ? "CFO" : role === "governor" ? "Governor" : "Accounting"} AI`);
    sections.push(`**Company:** ${companyName}`);
    sections.push("**Analysis request**\n" + clean);
    sections.push("**Recommended analysis**\n- Revenue and sales trend\n- Expenses and expense ratio\n- Cash inflow/outflow\n- Failed and successful transactions\n- Profitability and margin\n- Month-over-month and year-over-year change\n- Operational bottlenecks\n- Growth opportunities");
    sections.push("No financial figures were invented. Connect the company's actual records for numerical analysis.");
  } else if (role === "customer_service") {
    sections.push("## Xedruo Free Customer Service AI");
    sections.push("**Customer request**\n" + clean);
    sections.push("**Suggested handling**\n1. Identify the customer's issue.\n2. Check the customer's actual account/service record.\n3. Resolve when policy and records support the action.\n4. Escalate payment, security, legal or exceptional cases.\n5. Send a concise confirmation to the customer.");
  } else if (role === "hr") {
    sections.push("## Xedruo Free HR AI");
    sections.push("**Request**\n" + clean);
    sections.push("**Workflow**\n- Identify the role or employee process.\n- Match requirements to approved company policy.\n- Protect confidential employee information.\n- Record decisions and required follow-ups.\n- Escalate sensitive employment decisions to authorized HR staff.");
  } else if (role === "sports") {
    sections.push("## Sportruo Free Sports AI");
    sections.push("**Request**\n" + clean);
    sections.push("**Prediction framework**\nUse recent form, home/away performance, injuries, schedule strength, scoring rates and historical context. Produce probabilities only when sufficient data is supplied; never guarantee an outcome.");
  } else if (role === "elinit") {
    sections.push("## Enit AI — Free Mode");
    sections.push("**Request**\n" + clean);
    sections.push("**Routing**\nEnit identifies the task, selects the appropriate Xedruo specialist function, structures the work and returns an actionable workflow. Advanced foundation-model generation can be enabled later without changing the Xedruo AI interface.");
  } else {
    sections.push("## Xedruo Free AI");
    sections.push("**Request**\n" + clean);
    if (lower.includes("plan") || lower.includes("build")) sections.push("**Suggested next steps**\nDefine the goal → break it into tasks → identify required data/tools → execute → verify → measure results.");
    else sections.push("**Response framework**\nI can structure this request, identify the required information, produce an actionable workflow and flag anything that needs specialist or live-data assistance.");
  }

  const text = sections.join("\n\n");
  if (outputFormat === "json") return JSON.stringify({ mode: "free", company: companyName, role, response: text });
  if (outputFormat === "csv") return `section,content\n"Free AI mode","${text.replace(/"/g, '""').replace(/\n/g, " ")}"`;
  return text;
}
