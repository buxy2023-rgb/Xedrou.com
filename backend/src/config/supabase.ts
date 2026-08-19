import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("[supabase] SUPABASE_URL / SUPABASE_ANON_KEY are not set.");
}

// Keep the server bootable when the privileged Render secret has not yet been
// configured. Routes that require service-role privileges should still enforce
// their own authorization/RLS; production should set SUPABASE_SERVICE_ROLE_KEY.
const serverKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

/** Server-side Supabase client. Uses service role when configured, otherwise
 * falls back to the publishable/anon key so authentication can boot normally. */
export const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, serverKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Anon-key client used for sign-in/sign-up/OTP/password-reset operations. */
export const supabaseAnon: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Per-request client scoped to a specific user's access token. */
export function supabaseForToken(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
