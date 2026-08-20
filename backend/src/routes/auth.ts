import { Router } from "express";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { supabaseAdmin, supabaseAnon, supabaseForToken } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

function sessionPayload(session: any) {
  if (!session) return null;
  return { access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at };
}

function verifyPassword(password: string, encoded: string) {
  const [saltB64, hashB64] = String(encoded || "").split("$");
  if (!saltB64 || !hashB64) return false;
  try {
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const actual = scryptSync(password, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}

function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }

// ... existing auth handlers remain unchanged below ...
