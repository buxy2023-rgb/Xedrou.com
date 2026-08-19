import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { executePluginAction, logToolRun, pluginStatus } from "../services/developerTools";

const router = Router();
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

async function developerProfile(req: AuthedRequest) {
  const { data: profile } = await supabaseAdmin.from("profiles").select("id,email,full_name,role,job_role,is_active,company_slug").eq("id", req.user!.id).maybeSingle();
  if (profile) return profile;
  const { data: account } = await supabaseAdmin.from("developer_accounts").select("id,username,display_name,role,company_slug,is_active").eq("id", req.user!.id).maybeSingle();
  if (!account) return null;
  return { id: account.id, email: `${account.username.toLowerCase()}@xedruo.local`, full_name: account.display_name, role: account.role, job_role: "developer", company_slug: account.company_slug, is_active: account.is_active };
}
function canDevelop(profile: any) { return !!profile?.is_active && ["admin", "developer"].includes(profile.role); }
async function assertProject(req: AuthedRequest) {
  const { data, error } = await supabaseAdmin.from("developer_projects").select("id,company_id,slug,name,description,status,specification,companies(name,slug,industry,status)").eq("id", req.params.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw Object.assign(new Error("Project not found"), { status: 404 });
  if (data.status !== "active") throw Object.assign(new Error("Project is not active"), { status: 409 });
  return data;
}

router.get("/projects", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  const { data, error } = await supabaseAdmin.from("developer_projects").select("id,company_id,slug,name,project_type,description,status,specification,created_at,updated_at,companies(name,slug,industry,status)").order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ projects: data || [], profile });
});

router.get("/plugins", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  const { data, error } = await supabaseAdmin.from("developer_plugins").select("id,slug,name,category,description,provider,capabilities,enabled,requires_connection").eq("enabled", true).order("category").order("name");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ plugins: (data || []).map(p => ({ ...p, connection: pluginStatus()[(p.slug as keyof ReturnType<typeof pluginStatus>)] || { connected: false } })) });
});

router.get("/projects/:id", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  try {
    const project = await assertProject(req);
    const { data: builds, error: buildsError } = await supabaseAdmin.from("company_builds").select("id,company_id,created_by,specification,status,created_at,updated_at").eq("company_id", project.company_id).order("created_at", { ascending: false }).limit(20);
    if (buildsError) return res.status(500).json({ error: buildsError.message });
    const { data: plugins, error: pluginError } = await supabaseAdmin.from("developer_project_plugins").select("project_id,plugin_id,enabled,config,connected_at,developer_plugins(id,slug,name,category,provider,capabilities)").eq("project_id", project.id);
    if (pluginError) return res.status(500).json({ error: pluginError.message });
    res.json({ project, builds: builds || [], plugins: plugins || [], connections: pluginStatus(), profile });
  } catch (err: any) { res.status(err.status || 500).json({ error: err.message }); }
});

router.post("/projects/:id/prompt", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  if (!anthropic) return res.status(503).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
  const prompt = String(req.body?.prompt || "").trim();
  if (!prompt) return res.status(400).json({ error: "prompt is required" });
  try {
    const project = await assertProject(req);
    const { data: plugins } = await supabaseAdmin.from("developer_plugins").select("slug,name,category,provider,capabilities,requires_connection").eq("enabled", true);
    const statuses = pluginStatus();
    const result = await anthropic.messages.create({ model: "claude-sonnet-4-6", max_tokens: 5000, system: `You are the Xedruo Developer Build Agent. Convert the developer prompt into an executable, reviewable build plan for the selected company. Only use plugins whose connection is true. Return strict JSON: {summary,requirements[],implementation_steps[],files:[{path,content}],database_sql[],design_actions[],tool_actions:[{plugin,action,input}],deployment_steps[],risks[]}. Allowed tool actions: github/read_repo, github/write_files, supabase/read_schema, supabase/run_sql, figma/read_design, vercel/deploy. Never invent credentials, URLs, repo names or tool results. Selected project: ${project.name} (${project.slug}). Plugin connection status: ${JSON.stringify(statuses)}.`, messages: [{ role: "user", content: prompt }] });
    const text = result.content.map((block: any) => block.type === "text" ? block.text : "").join("\n");
    let plan: any;
    try { plan = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim()); } catch { return res.status(502).json({ error: "Build agent returned invalid JSON", raw: text }); }
    await supabaseAdmin.from("company_ai_memory").insert({ user_id: req.user!.id, company_slug: project.slug, role: "user", content: `[Developer prompt] ${prompt}` });
    res.json({ project, plan, availablePlugins: plugins || [], connections: statuses });
  } catch (err: any) { res.status(err.status || 502).json({ error: err.message || "Developer prompt failed" }); }
});

router.post("/projects/:id/execute", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  try {
    const project = await assertProject(req);
    const plan = req.body?.plan;
    if (!plan || !Array.isArray(plan.tool_actions)) return res.status(400).json({ error: "A generated build plan is required" });
    const { data: build, error: buildError } = await supabaseAdmin.from("company_builds").insert({ company_id: project.company_id, created_by: req.user!.id, specification: { prompt: String(req.body?.prompt || ""), plan, lifecycle: "executing", executedBy: req.user!.id }, status: "in_progress" }).select().single();
    if (buildError) return res.status(500).json({ error: buildError.message });
    const results: any[] = [];
    for (const action of plan.tool_actions.slice(0, 20)) {
      const plugin = String(action?.plugin || ""); const toolAction = String(action?.action || ""); const started = Date.now();
      try { const status = pluginStatus()[plugin as keyof ReturnType<typeof pluginStatus>]; if (!status?.connected) throw new Error(`${plugin} is not connected`); const output = await executePluginAction(plugin, toolAction, action.input || {}, { project, userId: req.user!.id, buildId: build.id }); await logToolRun({ project, userId: req.user!.id, buildId: build.id }, plugin, toolAction, "succeeded", action.input || {}, output); results.push({ plugin, action: toolAction, status: "succeeded", output, durationMs: Date.now() - started }); } catch (err: any) { await logToolRun({ project, userId: req.user!.id, buildId: build.id }, plugin, toolAction, "failed", action.input || {}, {}, err.message); results.push({ plugin, action: toolAction, status: "failed", error: err.message, durationMs: Date.now() - started }); }
    }
    const failed = results.filter(r => r.status === "failed").length;
    await supabaseAdmin.from("company_builds").update({ status: failed ? "failed" : "completed", specification: { prompt: String(req.body?.prompt || ""), plan, execution: results, lifecycle: failed ? "failed" : "completed" }, updated_at: new Date().toISOString() }).eq("id", build.id);
    res.status(failed ? 207 : 200).json({ buildId: build.id, status: failed ? "partial_failure" : "completed", results });
  } catch (err: any) { res.status(err.status || 500).json({ error: err.message }); }
});

router.post("/projects/:id/advance", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  try {
    const project = await assertProject(req); const input = req.body || {};
    const requestedFeatures = Array.isArray(input.features) ? input.features.map((value: unknown) => String(value).trim()).filter(Boolean) : [];
    const specification = { templateVersion: "1.0.0", company: { name: project.name, slug: project.slug, industry: String(input.industry || "").trim(), description: String(input.description || project.description || "").trim(), domain: String(input.domain || `${project.slug}.com`).trim() }, modules: { publicWebsite: true, customerPortal: true, staffPortal: true, customerService: true, accounting: true, developerWorkspace: true, companyAI: true }, requestedFeatures, prompt: String(input.prompt || "").trim(), lifecycle: "in_progress", advancedBy: req.user!.id, advancedAt: new Date().toISOString() };
    const { data: build, error: buildError } = await supabaseAdmin.from("company_builds").insert({ company_id: project.company_id, created_by: req.user!.id, specification, status: "in_progress" }).select().single();
    if (buildError) return res.status(500).json({ error: buildError.message });
    const initialPages = [{ company_slug: project.slug, slug: "home", title: project.name, content: { pageType: "landing", projectId: project.id }, published: false, updated_by: req.user!.id }, { company_slug: project.slug, slug: "about", title: `About ${project.name}`, content: { pageType: "content", projectId: project.id }, published: false, updated_by: req.user!.id }, { company_slug: project.slug, slug: "contact", title: `Contact ${project.name}`, content: { pageType: "contact", projectId: project.id }, published: false, updated_by: req.user!.id }];
    const { error: pagesError } = await supabaseAdmin.from("company_site_pages").upsert(initialPages.map(page => ({ ...page, updated_at: new Date().toISOString() })), { onConflict: "company_slug,slug" });
    if (pagesError) return res.status(500).json({ error: pagesError.message });
    await supabaseAdmin.from("developer_projects").update({ specification, updated_at: new Date().toISOString() }).eq("id", project.id);
    res.status(201).json({ project: { ...project, specification }, build, pages: initialPages.map(p => p.slug) });
  } catch (err: any) { res.status(err.status || 500).json({ error: err.message }); }
});

export default router;
