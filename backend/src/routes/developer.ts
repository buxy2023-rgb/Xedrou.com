import { Router } from "express";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

async function developerProfile(req: AuthedRequest) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id,email,full_name,role,job_role,is_active")
    .eq("id", req.user!.id)
    .maybeSingle();
  return data;
}

function canDevelop(profile: any) {
  return !!profile?.is_active && ["admin", "developer"].includes(profile.role);
}

router.get("/projects", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });

  const { data, error } = await supabaseAdmin
    .from("developer_projects")
    .select("id,company_id,slug,name,project_type,description,status,specification,created_at,updated_at,companies(name,slug,industry,status)")
    .order("name", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ projects: data || [], profile });
});

router.get("/projects/:id", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });

  const { data, error } = await supabaseAdmin
    .from("developer_projects")
    .select("id,company_id,slug,name,project_type,description,status,specification,created_at,updated_at,companies(name,slug,industry,status)")
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Project not found" });

  const { data: builds, error: buildsError } = await supabaseAdmin
    .from("company_builds")
    .select("id,company_id,created_by,specification,status,created_at,updated_at")
    .eq("company_id", data.company_id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (buildsError) return res.status(500).json({ error: buildsError.message });
  res.json({ project: data, builds: builds || [], profile });
});

router.post("/projects/:id/advance", requireAuth, async (req: AuthedRequest, res) => {
  const profile = await developerProfile(req);
  if (!canDevelop(profile)) return res.status(403).json({ error: "Developer access required" });

  const { data: project, error: projectError } = await supabaseAdmin
    .from("developer_projects")
    .select("id,company_id,slug,name,description,status,specification")
    .eq("id", req.params.id)
    .maybeSingle();

  if (projectError) return res.status(500).json({ error: projectError.message });
  if (!project) return res.status(404).json({ error: "Project not found" });
  if (project.status !== "active") return res.status(409).json({ error: "Project is not active" });

  const input = req.body || {};
  const requestedFeatures = Array.isArray(input.features)
    ? input.features.map((value: unknown) => String(value).trim()).filter(Boolean)
    : [];

  const specification = {
    templateVersion: "1.0.0",
    company: {
      name: project.name,
      slug: project.slug,
      industry: String(input.industry || "").trim(),
      description: String(input.description || project.description || "").trim(),
      domain: String(input.domain || `${project.slug}.com`).trim(),
    },
    modules: {
      publicWebsite: true,
      customerPortal: true,
      staffPortal: true,
      customerService: true,
      accounting: true,
      developerWorkspace: true,
      companyAI: true,
    },
    requestedFeatures,
    lifecycle: "in_progress",
    advancedBy: req.user!.id,
    advancedAt: new Date().toISOString(),
  };

  const { data: build, error: buildError } = await supabaseAdmin
    .from("company_builds")
    .insert({ company_id: project.company_id, created_by: req.user!.id, specification, status: "in_progress" })
    .select()
    .single();

  if (buildError) return res.status(500).json({ error: buildError.message });

  const initialPages = [
    { company_slug: project.slug, slug: "home", title: project.name, content: { pageType: "landing", projectId: project.id }, published: false, updated_by: req.user!.id },
    { company_slug: project.slug, slug: "about", title: `About ${project.name}`, content: { pageType: "content", projectId: project.id }, published: false, updated_by: req.user!.id },
    { company_slug: project.slug, slug: "contact", title: `Contact ${project.name}`, content: { pageType: "contact", projectId: project.id }, published: false, updated_by: req.user!.id },
  ];

  const { error: pagesError } = await supabaseAdmin
    .from("company_site_pages")
    .upsert(initialPages.map((page) => ({ ...page, updated_at: new Date().toISOString() })), { onConflict: "company_slug,slug" });

  if (pagesError) return res.status(500).json({ error: pagesError.message });

  const { error: projectUpdateError } = await supabaseAdmin
    .from("developer_projects")
    .update({ specification, updated_at: new Date().toISOString() })
    .eq("id", project.id);

  if (projectUpdateError) return res.status(500).json({ error: projectUpdateError.message });

  res.status(201).json({ project: { ...project, specification }, build, pages: initialPages.map((p) => p.slug) });
});

export default router;
