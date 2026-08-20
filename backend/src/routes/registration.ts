import { Router } from "express";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

function isValidTimeZone(timeZone: string) {
  try { new Intl.DateTimeFormat("en-US", { timeZone }).format(); return true; }
  catch { return false; }
}

function normalizePhone(value: string) {
  return value.replace(/[^0-9+]/g, "");
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
  try { await supabaseAdmin.auth.admin.updateUserById(req.user!.id, { user_metadata: { ...(req.user?.user_metadata || {}), country_code, currency_code, time_zone, locale } }); } catch {}
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

router.post("/complete", requireAuth, async (req: AuthedRequest, res) => {
  const country_code = String(req.body?.country_code || "").trim().toUpperCase();
  const currency_code = String(req.body?.currency_code || "").trim().toUpperCase();
  const time_zone = String(req.body?.time_zone || "").trim();
  const locale = String(req.body?.locale || "en").trim() || "en";
  const phone = normalizePhone(String(req.user?.user_metadata?.phone_number || ""));
  if (!/^[A-Z]{2}$/.test(country_code)) return res.status(400).json({ error: "A valid country selection is required" });
  if (!/^[A-Z]{3}$/.test(currency_code)) return res.status(400).json({ error: "A valid currency is required" });
  if (!isValidTimeZone(time_zone)) return res.status(400).json({ error: "A valid time zone is required" });
  if (phone.length < 7) return res.status(400).json({ error: "Phone number is required before Xedruo account creation" });

  const { data: existing } = await supabaseAdmin.from("xedruo_users").select("*").eq("id", req.user!.id).maybeSingle();
  if (existing) {
    await supabaseAdmin.from("xedruo_users").update({ country_code, currency_code, time_zone, locale, updated_at: new Date().toISOString() }).eq("id", req.user!.id);
    return res.json({ xedruo_user: { ...existing, country_code, currency_code, time_zone, locale } });
  }

  const { data: generated, error: idError } = await supabaseAdmin.rpc("generate_xedruo_id");
  if (idError || !generated) return res.status(500).json({ error: "Unable to generate your Xedruo ID" });
  const { data: created, error } = await supabaseAdmin.from("xedruo_users").insert({
    id: req.user!.id,
    xedruo_id: String(generated).padStart(10, "0"),
    phone_account_number: phone,
    phone_verified: false,
    email_verified: !!req.user!.email_confirmed_at,
    display_name: req.user!.user_metadata?.full_name || req.user!.user_metadata?.name || req.user!.email,
    country_code,
    currency_code,
    time_zone,
    locale,
    status: "active"
  }).select().single();
  if (error) {
    if (String(error.code) === "23505") {
      const { data: retry } = await supabaseAdmin.from("xedruo_users").select("*").eq("id", req.user!.id).maybeSingle();
      if (retry) return res.json({ xedruo_user: retry });
    }
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json({ xedruo_user: created });
});

export default router;
