import { Router } from "express";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

function isValidTimeZone(timeZone: string) {
  try { new Intl.DateTimeFormat("en-US", { timeZone }).format(); return true; }
  catch { return false; }
}

router.post("/country", requireAuth, async (req: AuthedRequest, res) => {
  const country_code = String(req.body?.country_code || "").trim().toUpperCase();
  const currency_code = String(req.body?.currency_code || "").trim().toUpperCase();
  const time_zone = String(req.body?.time_zone || "").trim();
  const locale = String(req.body?.locale || "").trim() || "en";
  if (!/^[A-Z]{2}$/.test(country_code)) return res.status(400).json({ error: "A valid country selection is required" });
  if (!/^[A-Z]{3}$/.test(currency_code)) return res.status(400).json({ error: "A valid currency is required" });
  if (!isValidTimeZone(time_zone)) return res.status(400).json({ error: "A valid time zone is required" });
  const profilePayload = { id: req.user!.id, email: req.user!.email, role: "user", country_code, currency_code, time_zone, locale };
  const { data: profile, error } = await supabaseAdmin.from("profiles").upsert(profilePayload, { onConflict: "id" }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await supabaseAdmin.from("xedruo_users").update({ country_code, currency_code, time_zone, locale, updated_at: new Date().toISOString() }).eq("id", req.user!.id);
  try { await supabaseAdmin.auth.admin.updateUserById(req.user!.id, { user_metadata: { country_code, currency_code, time_zone, locale } }); } catch {}
  res.status(201).json({ profile, registration: { country_code, currency_code, time_zone, locale } });
});

router.post("/phone", requireAuth, async (req: AuthedRequest, res) => {
  const phone_number = String(req.body?.phone_number || "").trim();
  if (!/^[+0-9][0-9 ()-]{6,24}$/.test(phone_number)) return res.status(400).json({ error: "A valid phone number is required" });
  const existingMetadata = req.user?.user_metadata || {};
  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, { user_metadata: { ...existingMetadata, phone_number } });
  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json({ phone_number });
});

export default router;
