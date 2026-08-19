import { Router } from "express";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

function canView(role?: string, jobRole?: string) {
  const r = String(role || "").toLowerCase();
  const j = String(jobRole || "").toLowerCase();
  return ["admin", "super_admin", "governor", "ceo", "cfo"].includes(r) || j.includes("ceo") || j.includes("governor") || j.includes("cfo");
}

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role,job_role,is_active,company_slug")
    .eq("id", req.user!.id)
    .maybeSingle();
  if (profileError) return res.status(500).json({ error: profileError.message });
  if (!profile?.is_active || !canView(profile.role, profile.job_role)) return res.status(403).json({ error: "Executive access required" });

  const { data, error } = await supabaseAdmin.rpc("get_platform_usage_metrics_admin");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || {});
});

export default router;
