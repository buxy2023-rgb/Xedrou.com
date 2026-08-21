import { supabaseAdmin } from "../config/supabase";

type Credential = { salt: string; hash: string };

type WorkforceConfig = { displayName: string; role: "governor" | "chief_of_staff" | "developer"; companySlug?: string | null; credential: Credential; googleEnv?: string };

// Passwords are never stored here. Google emails are supplied through Render
// environment variables so the source code never contains private identities.
const configured: Record<string, WorkforceConfig> = {
  miracle: { displayName: "Olowolafe Miracle", role: "governor", credential: { salt: "5/OjnDvwXBFiS038Leg9Ag==", hash: "Zj3LUM3SZHNy4AHU7/FF5LRWVCYMneptu8OuEmUkiWHcBoMN5Lc5euWV5DvVS8ZIwW5vkZkKokofTdtRZ4l7ew==" }, googleEnv: "GOOGLE_GOVERNOR_MIRACLE_EMAIL" },
  blessing: { displayName: "Olowolafe Blessing", role: "governor", credential: { salt: "mKvnWC8weECvkyFq+pQhow==", hash: "AEyYtHIECfr/+0FndczuBm+wmz585ujKjkoaKwQMvo46z6qGYuJD+5p/ZLdaB+N3aROjEV8uqvneBPHdq7l39w==" }, googleEnv: "GOOGLE_GOVERNOR_BLESSING_EMAIL" },
  cassiee: { displayName: "Cassiee", role: "chief_of_staff", credential: { salt: "5ArgR7xjEzMANAn3M60nzw==", hash: "KLcPaLOiC+B8UG1RDfxGsuZ/Py+Dgzl8KATyILLtePeJ4qaLwfHwZQVHPFaHP92DppGntci3kXTynaS/9OEDsA==" }, googleEnv: "GOOGLE_CHIEF_OF_STAFF_EMAIL" },
  David: { displayName: "David", role: "developer", companySlug: "xedruo-power-holdings", credential: { salt: "developer-google", hash: "google-only" }, googleEnv: "GOOGLE_DEVELOPER_DAVID_EMAIL" },
};

async function ensureAccount(username: string, config: WorkforceConfig) {
  const { data: existing, error: lookupError } = await supabaseAdmin.from("workforce_accounts").select("id").eq("username", username).maybeSingle();
  if (lookupError) throw lookupError;
  const values = {
    username, display_name: config.displayName, role: config.role, company_slug: config.companySlug || null,
    password_hash: config.credential.hash, password_salt: config.credential.salt, is_active: true,
    ...(config.googleEnv ? { google_email: process.env[config.googleEnv]?.trim().toLowerCase() || null } : {}),
    updated_at: new Date().toISOString(),
  };
  if (existing?.id) {
    const { error } = await supabaseAdmin.from("workforce_accounts").update(values).eq("id", existing.id); if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from("workforce_accounts").insert(values); if (error) throw error;
  }
}

let bootstrapped = false;
export async function ensureConfiguredWorkforceAccounts() {
  if (bootstrapped) return;
  for (const [username, config] of Object.entries(configured)) {
    try { await ensureAccount(username, config); }
    catch (error) { console.error(`[workforce] unable to sync ${username}`, error); }
  }
  bootstrapped = true;
}
