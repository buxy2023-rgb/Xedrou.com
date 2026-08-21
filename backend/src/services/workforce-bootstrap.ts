import crypto from "crypto";
import { supabaseAdmin } from "../config/supabase";

const makePassword = (password: string) => {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return { salt: salt.toString("base64"), hash: hash.toString("base64") };
};

async function ensureAccount(username: string, displayName: string, role: "governor" | "chief_of_staff", password?: string) {
  if (!password) return;
  const normalized = username.trim().toLowerCase();
  const { data: existing, error: lookupError } = await supabaseAdmin.from("workforce_accounts").select("id").eq("username", normalized).maybeSingle();
  if (lookupError) throw lookupError;
  const p = makePassword(password);
  if (existing?.id) {
    const { error } = await supabaseAdmin.from("workforce_accounts").update({ display_name: displayName, role, company_slug: null, password_hash: p.hash, password_salt: p.salt, is_active: true, updated_at: new Date().toISOString() }).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from("workforce_accounts").insert({ username: normalized, display_name: displayName, role, company_slug: null, password_hash: p.hash, password_salt: p.salt, is_active: true });
    if (error) throw error;
  }
}

let bootstrapped = false;
export async function ensureConfiguredWorkforceAccounts() {
  if (bootstrapped) return;
  if (String(process.env.WORKFORCE_BOOTSTRAP_ENABLED || "").toLowerCase() !== "true") return;
  await ensureAccount("miracle", "Olowolafe Miracle", "governor", process.env.GOVERNOR_MIRACLE_PASSWORD);
  await ensureAccount("blessing", "Olowolafe Blessing", "governor", process.env.GOVERNOR_BLESSING_PASSWORD);
  await ensureAccount("cassiee", "Cassiee", "chief_of_staff", process.env.CHIEF_OF_STAFF_CASSIEE_PASSWORD);
  bootstrapped = true;
}
