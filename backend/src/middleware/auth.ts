import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";

export interface AuthedRequest extends Request {
  user?: { id: string; email?: string; role?: string };
  accessToken?: string;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return null;
}

export async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (!error && data.user) {
    req.accessToken = token;
    req.user = { id: data.user.id, email: data.user.email ?? undefined };
    const { data: profile } = await supabaseAdmin.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    if (profile?.role) req.user.role = profile.role;
  }
  next();
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  await optionalAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    next();
  });
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  next();
}
