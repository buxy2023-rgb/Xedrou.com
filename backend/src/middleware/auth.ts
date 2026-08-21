import { NextFunction, Request, Response } from "express";
import { createHash } from "crypto";
import { supabaseAdmin } from "../config/supabase";
export interface AuthedRequest extends Request { user?: { id: string; email?: string; role?: string; username?: string; company_slug?: string; user_metadata?: Record<string, any> }; accessToken?: string; }
function extractToken(req: Request): string | null { const header=req.headers.authorization; return header?.startsWith("Bearer ") ? header.slice(7) : null; }
function tokenHash(token: string){ return createHash("sha256").update(token).digest("hex"); }
export async function optionalAuth(req: AuthedRequest,_res: Response,next: NextFunction){
 const token=extractToken(req); if(!token) return next();
 const {data: workforce}=await supabaseAdmin.from("workforce_sessions").select("account_id,expires_at,workforce_accounts(id,username,display_name,role,company_slug,is_active)").eq("token_hash",tokenHash(token)).gt("expires_at",new Date().toISOString()).maybeSingle();
 const workforceAccount:any=workforce?.workforce_accounts;
 if(workforce && workforceAccount?.is_active){ req.accessToken=token; req.user={id:workforceAccount.id,email:`${workforceAccount.username.toLowerCase()}@xedruo.local`,role:workforceAccount.role,username:workforceAccount.username,company_slug:workforceAccount.company_slug,user_metadata:{display_name:workforceAccount.display_name,workforce:true}}; return next(); }
 const {data,error}=await supabaseAdmin.auth.getUser(token);
 if(!error && data.user){ req.accessToken=token; req.user={id:data.user.id,email:data.user.email??undefined,user_metadata:data.user.user_metadata||{}}; const {data:profile}=await supabaseAdmin.from("profiles").select("role,company_slug").eq("id",data.user.id).maybeSingle(); if(profile?.role) req.user.role=profile.role; if(profile?.company_slug) req.user.company_slug=profile.company_slug; return next(); }
 const {data:devSession}=await supabaseAdmin.from("developer_sessions").select("account_id,expires_at,developer_accounts(id,username,display_name,role,company_slug,is_active)").eq("token_hash",tokenHash(token)).gt("expires_at",new Date().toISOString()).maybeSingle(); const account:any=devSession?.developer_accounts; if(devSession&&account?.is_active){req.accessToken=token;req.user={id:account.id,email:`${account.username.toLowerCase()}@xedruo.local`,role:account.role,username:account.username,company_slug:account.company_slug,user_metadata:{}};} next();
}
export async function requireAuth(req:AuthedRequest,res:Response,next:NextFunction){await optionalAuth(req,res,()=>{if(!req.user)return res.status(401).json({error:"Authentication required"});next();});}
export function requireAdmin(req:AuthedRequest,res:Response,next:NextFunction){if(req.user?.role!=="admin")return res.status(403).json({error:"Admin access required"});next();}
