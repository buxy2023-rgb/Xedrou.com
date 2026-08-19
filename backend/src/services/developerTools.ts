import crypto from "crypto";
import { supabaseAdmin } from "../config/supabase";

export type ToolContext = { project: any; userId: string; buildId?: string | null };

const jsonHeaders = { "Content-Type": "application/json", Accept: "application/vnd.github+json" };

function env(name: string) { return process.env[name]?.trim() || ""; }
function secretConfigured(plugin: string) {
  if (plugin === "github") return !!env("GITHUB_TOKEN") && !!env("GITHUB_REPOSITORY");
  if (plugin === "supabase") return !!env("SUPABASE_SERVICE_ROLE_KEY") && !!env("SUPABASE_URL");
  if (plugin === "vercel") return !!env("VERCEL_DEPLOY_HOOK_URL") || !!env("VERCEL_TOKEN");
  if (plugin === "figma") return !!env("FIGMA_ACCESS_TOKEN");
  return false;
}

export function pluginStatus() {
  return {
    github: { connected: secretConfigured("github"), repository: env("GITHUB_REPOSITORY") || null },
    supabase: { connected: secretConfigured("supabase") },
    vercel: { connected: secretConfigured("vercel") },
    figma: { connected: secretConfigured("figma") },
    "web-design": { connected: false, mode: "registry_only" },
  };
}

async function githubApi(path: string, init: RequestInit = {}) {
  const token = env("GITHUB_TOKEN");
  if (!token) throw new Error("GitHub is not connected: GITHUB_TOKEN is missing");
  const response = await fetch(`https://api.github.com${path}`, { ...init, headers: { ...jsonHeaders, Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GitHub ${response.status}: ${body.message || response.statusText}`);
  return body;
}

async function githubWriteFiles(files: Array<{ path: string; content: string }>, branch: string, message: string) {
  const repo = env("GITHUB_REPOSITORY");
  if (!repo || !repo.includes("/")) throw new Error("GITHUB_REPOSITORY must be owner/repository");
  const [owner, name] = repo.split("/", 2);
  const repoInfo = await githubApi(`/repos/${owner}/${name}`);
  await githubApi(`/repos/${owner}/${name}/git/ref/heads/${encodeURIComponent(repoInfo.default_branch)}`);
  const ref = await githubApi(`/repos/${owner}/${name}/git/ref/heads/${encodeURIComponent(repoInfo.default_branch)}`);
  await githubApi(`/repos/${owner}/${name}/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: ref.object.sha }) });
  const results = [];
  for (const file of files.slice(0, 40)) {
    const existing = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${file.path}?ref=${encodeURIComponent(branch)}`, { headers: { ...jsonHeaders, Authorization: `Bearer ${env("GITHUB_TOKEN")}` } });
    const existingBody = await existing.json().catch(() => ({}));
    const payload: any = { message, content: Buffer.from(file.content, "utf8").toString("base64"), branch };
    if (existing.ok && existingBody.sha) payload.sha = existingBody.sha;
    const written = await githubApi(`/repos/${owner}/${name}/contents/${file.path}`, { method: "PUT", body: JSON.stringify(payload) });
    results.push({ path: file.path, commit: written.commit?.sha || null });
  }
  return { repository: repo, branch, files: results };
}

async function supabaseRunSql(sql: string) {
  if (!secretConfigured("supabase")) throw new Error("Supabase is not connected: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing");
  const statement = String(sql || "").trim();
  if (!statement) throw new Error("SQL statement is empty");
  if (statement.length > 20000) throw new Error("SQL statement exceeds safety limit");
  const blocked = /\b(drop\s+database|drop\s+schema|alter\s+role|create\s+role|grant\s+all|revoke\s+all)\b/i;
  if (blocked.test(statement)) throw new Error("Blocked destructive or privilege-changing SQL");
  const { data, error } = await supabaseAdmin.rpc("exec_sql", { sql: statement });
  if (error) throw new Error(`Supabase SQL: ${error.message}`);
  return { executed: true, result: data };
}

async function vercelDeploy() {
  if (env("VERCEL_DEPLOY_HOOK_URL")) {
    const response = await fetch(env("VERCEL_DEPLOY_HOOK_URL"), { method: "POST" });
    if (!response.ok) throw new Error(`Vercel deploy hook failed (${response.status})`);
    return { triggered: true, method: "deploy_hook" };
  }
  throw new Error("Vercel is not connected: configure VERCEL_DEPLOY_HOOK_URL");
}

async function figmaInspect(fileKey: string) {
  if (!env("FIGMA_ACCESS_TOKEN")) throw new Error("Figma is not connected: FIGMA_ACCESS_TOKEN is missing");
  const response = await fetch(`https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}?depth=1`, { headers: { "X-Figma-Token": env("FIGMA_ACCESS_TOKEN") } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Figma ${response.status}: ${body.err || response.statusText}`);
  return { key: fileKey, name: body.name, lastModified: body.lastModified, version: body.version, pages: (body.document?.children || []).map((p: any) => ({ id: p.id, name: p.name })) };
}

export async function executePluginAction(plugin: string, action: string, input: any, context: ToolContext) {
  if (plugin === "github" && action === "write_files") {
    const files = Array.isArray(input?.files) ? input.files.filter((f: any) => f && typeof f.path === "string" && typeof f.content === "string") : [];
    if (!files.length) throw new Error("No files supplied to GitHub write_files");
    const safeSlug = context.project.slug.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const branch = input.branch || `xedruo/${safeSlug}/${crypto.randomUUID().slice(0, 8)}`;
    return githubWriteFiles(files, branch, input.message || `Xedruo: advance ${context.project.name}`);
  }
  if (plugin === "github" && action === "read_repo") {
    const repo = env("GITHUB_REPOSITORY");
    const info = await githubApi(`/repos/${repo}`);
    return { repository: info.full_name, defaultBranch: info.default_branch, private: info.private, url: info.html_url };
  }
  if (plugin === "supabase" && action === "run_sql") return supabaseRunSql(input?.sql);
  if (plugin === "supabase" && action === "read_schema") {
    const { data, error } = await supabaseAdmin.from("developer_projects").select("id,company_id,slug,name,status").eq("id", context.project.id).maybeSingle();
    if (error) throw new Error(error.message);
    return { project: data };
  }
  if (plugin === "vercel" && action === "deploy") return vercelDeploy();
  if (plugin === "figma" && action === "read_design") return figmaInspect(String(input?.fileKey || env("FIGMA_FILE_KEY")));
  throw new Error(`Unsupported plugin action: ${plugin}/${action}`);
}

export async function logToolRun(context: ToolContext, plugin: string, action: string, status: string, input: any, output: any = {}, error?: string) {
  await supabaseAdmin.from("developer_tool_runs").insert({ project_id: context.project.id, build_id: context.buildId || null, user_id: context.userId, plugin_slug: plugin, action, status, input, output, error: error || null, started_at: new Date().toISOString(), finished_at: new Date().toISOString() });
}
