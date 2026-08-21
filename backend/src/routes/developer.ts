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
function isAdmin(profile: any) { return profile?.role === "admin"; }

async function assertProject(req: AuthedRequest, profile: any) {
  const { data, error } = await supabaseAdmin.from("developer_projects").select("id,company_id,slug,name,project_type,description,status,specification,created_at,updated_at,companies(name,slug,industry,status)").eq("id", req.params.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw Object.assign(new Error("Project not found"), { status: 404 });
  if (data.status !== "active") throw Object.assign(new Error("Project is not active"), { status: 409 });
  // Developers are automatically scoped to the company assigned to their developer profile.
  // Only CEO/admin accounts can cross company boundaries.
  if (!isAdmin(profile) && profile.company_slug && data.slug !== profile.company_slug && data.companies?.slug !== profile.company_slug) {
    throw Object.assign(new Error("This developer workstation is restricted to your assigned company"), { status: 403 });
  }
  if (!isAdmin(profile) && !profile.company_slug) throw Object.assign(new Error("Developer account has no company assignment"), { status: 403 });
  return data;
}

router.get("/projects", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  let query = supabaseAdmin.from("developer_projects").select("id,company_id,slug,name,project_type,description,status,specification,created_at,updated_at,companies(name,slug,industry,status)").eq("status", "active").order("name", { ascending: true });
  if (!isAdmin(profile)) query = query.eq("slug", profile.company_slug);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ projects: data || [], profile });
});

router.get("/plugins", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  const { data, error } = await supabaseAdmin.from("developer_plugins").select("id,slug,name,category,description,provider,capabilities,enabled,requires_connection").eq("enabled", true).order("category").order("name");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ plugins: (data || []).map(p => ({ ...p, connection: pluginStatus()[p.slug as keyof ReturnType<typeof pluginStatus>] || { connected: false } })) });
});

router.get("/projects/:id", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  try {
    const project = await assertProject(req, profile);
    const { data: builds, error: buildsError } = await supabaseAdmin.from("company_builds").select("id,company_id,created_by,specification,status,created_at,updated_at").eq("company_id", project.company_id).order("created_at", { ascending: false }).limit(20);
    if (buildsError) return res.status(500).json({ error: buildsError.message });
    const { data: plugins, error: pluginError } = await supabaseAdmin.from("developer_project_plugins").select("project_id,plugin_id,enabled,config,connected_at,developer_plugins(id,slug,name,category,provider,capabilities)").eq("project_id", project.id);
    if (pluginError) return res.status(500).json({ error: pluginError.message });
    res.json({ project, builds: builds || [], plugins: plugins || [], connections: pluginStatus(), profile, workstation: { company_locked: !isAdmin(profile), company_slug: project.companies?.slug || project.slug, developer_id: req.user!.id } });
  } catch (err: any) { res.status(err.status || 500).json({ error: err.message }); }
});

router.get("/projects/:id/preview", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  try {
    const project = await assertProject(req, profile);
    const spec: any = project.specification || {};
    const configured = spec.previewUrl || spec.preview_url || spec.deploymentUrl || spec.deployment_url || null;
    const fallback = project.slug === "xedruo" ? "https://xedruo-web.onrender.com" : `https://${project.slug}.onrender.com`;
    res.json({ project: { id: project.id, name: project.name, slug: project.slug }, previewUrl: configured || fallback, isConfigured: !!configured });
  } catch (err: any) { res.status(err.status || 500).json({ error: err.message }); }
});

router.post("/projects/:id/prompt", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  if (!anthropic) return res.status(503).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
  const prompt = String(req.body?.prompt || "").trim();
  if (!prompt) return res.status(400).json({ error: "prompt is required" });
  try {
    const project = await assertProject(req, profile);
    const { data: plugins } = await supabaseAdmin.from("developer_plugins").select("slug,name,category,provider,capabilities,requires_connection").eq("enabled", true);
    const statuses = pluginStatus();
    const result = await anthropic.messages.create({ model: "claude-sonnet-4-6", max_tokens: 5000, system: `You are ELinit, the underground engineering assistant for an authenticated Xedruo Developer Workstation. You are assisting the developer assigned to exactly one company. Never cross that company boundary. Convert the developer prompt into an executable, reviewable build plan for the selected project. Only use plugins whose connection is true. Return strict JSON: {summary,requirements[],implementation_steps[],files:[{path,content}],database_sql[],design_actions[],tool_actions:[{plugin,action,input}],deployment_steps[],risks[]}. Allowed tool actions: github/read_repo, github/write_files, supabase/read_schema, supabase/run_sql, figma/read_design, vercel/deploy. Never invent credentials, URLs, repo names or tool results. Selected project: ${project.name} (${project.slug}). Developer company scope: ${profile.company_slug}. Plugin connection status: ${JSON.stringify(statuses)}.` , messages: [{ role: "user", content: prompt }] });
    const text = result.content.map((block: any) => block.type === "text" ? block.text : "").join("\n");
    let plan: any;
    try { plan = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim()); } catch { return res.status(502).json({ error: "ELinit returned invalid build JSON", raw: text }); }
    await supabaseAdmin.from("company_ai_memory").insert({ user_id: req.user!.id, company_slug: project.slug, role: "user", content: `[Developer workstation / ELinit] ${prompt}` });
    res.json({ project, plan, availablePlugins: plugins || [], connections: statuses, assistant: "ELinit" });
  } catch (err: any) { res.status(err.status || 502).json({ error: err.message || "ELinit developer request failed" }); }
});

router.post("/projects/:id/execute", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });
  try {
    const project = await assertProject(req, profile);
    const plan = req.body?.plan;
    if (!plan || !Array.isArray(plan.tool_actions)) return res.status(400).json({ error: "A generated build plan is required" });
    const { data: build, error: buildError } = await supabaseAdmin.from("company_builds").insert({ company_id: project.company_id, created_by: req.user!.id, specification: { prompt: String(req.body?.prompt || ""), plan, lifecycle: "executing", executedBy: req.user!.id, assistant: "ELinit" }, status: "in_progress" }).select().single();
    if (buildError) return res.status(500).json({ error: buildError.message });
    const results: any[] = [];
    for (const action of plan.tool_actions.slice(0, 20)) {
      const plugin = String(action?.plugin || ""); const toolAction = String(action?.action || ""); const started = Date.now();
      try { const status = pluginStatus()[plugin as keyof ReturnType<typeof pluginStatus>]; if (!status?.connected) throw new Error(`${plugin} is not connected`); const output = await executePluginAction(plugin, toolAction, action.input || {}, { project, userId: req.user!.id, buildId: build.id }); await logToolRun({ project, userId: req.user!.id, buildId: build.id }, plugin, toolAction, "succeeded", action.input || {}, output); results.push({ plugin, action: toolAction, status: "succeeded", output, durationMs: Date.now() - started }); } catch (err: any) { await logToolRun({ project, userId: req.user!.id, buildId: build.id }, plugin, toolAction, "failed", action.input || {}, {}, err.message); results.push({ plugin, action: toolAction, status: "failed", error: err.message, durationMs: Date.now() - started }); }
    }
    const failed = results.filter(r => r.status === "failed").length;
    await supabaseAdmin.from("company_builds").update({ status: failed ? "failed" : "completed", specification: { prompt: String(req.body?.prompt || ""), plan, execution: results, lifecycle: failed ? "failed" : "completed", assistant: "ELinit" }, updated_at: new Date().toISOString() }).eq("id", build.id);
    res.status(failed ? 207 : 200).json({ buildId: build.id, status: failed ? "partial_failure" : "completed", results });
  } catch (err: any) { res.status(err.status || 500).json({ error: err.message }); }
});

export default router;
