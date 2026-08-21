import { Router } from "express";
import crypto from "crypto";
import { supabaseAdmin } from "../config/supabase";

const router=Router(); const SESSION_DAYS=30;
const hashToken=(t:string)=>crypto.createHash("sha256").update(t).digest("hex");
const internalRoles=["governor","chief_of_staff","developer","admin"];

async function accountFromToken(token?:string){if(!token)return null;const {data}=await supabaseAdmin.from("workforce_sessions").select("account_id,expires_at,workforce_accounts(id,username,display_name,role,company_slug,is_active)").eq("token_hash",hashToken(token)).gt("expires_at",new Date().toISOString()).maybeSingle();const a:any=data?.workforce_accounts;return data&&a?.is_active?a:null;}
async function requireRole(req:any,res:any,roles:string[]){const token=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");const account=await accountFromToken(token);if(!account){res.status(401).json({error:"Workforce authentication required"});return null;}if(!roles.includes(account.role)){res.status(403).json({error:"Holding Company access denied"});return null;}req.workforceAccount=account;return account;}
async function audit(actor:any,action:string,targetId:string|null,companySlug:string|null,details:any={}){await supabaseAdmin.from("workforce_audit_log").insert({actor_id:actor.id,action,target_id:targetId,company_slug:companySlug,details});}

// Password login is retired. Workforce identity is established by Google OAuth.
router.post("/login",(_req,res)=>res.status(410).json({error:"Password login has been removed. Use Continue with Google."}));
router.post("/password",(_req,res)=>res.status(410).json({error:"AI and workforce passwords are not used. Use Continue with Google."}));

router.get("/me",async(req,res)=>{const token=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");const account=await accountFromToken(token);if(!account)return res.status(401).json({error:"Not authenticated"});if(!internalRoles.includes(account.role))return res.status(403).json({error:"Public customers cannot access Xedruo Holding Company"});res.json({account});});
router.post("/logout",async(req,res)=>{const token=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");if(token)await supabaseAdmin.from("workforce_sessions").delete().eq("token_hash",hashToken(token));res.json({ok:true});});

router.get("/companies",async(req,res)=>{const account=await requireRole(req,res,["governor","chief_of_staff","admin"]);if(!account)return;const {data,error}=await supabaseAdmin.from("companies").select("company_id,name,slug,industry,status").order("name");if(error)return res.status(500).json({error:error.message});res.json({companies:data||[]});});
router.get("/accounts",async(req,res)=>{const account=await requireRole(req,res,["governor","chief_of_staff"]);if(!account)return;const {data,error}=await supabaseAdmin.from("workforce_accounts").select("id,username,display_name,role,company_slug,is_active,created_at,updated_at").order("created_at",{ascending:false});if(error)return res.status(500).json({error:error.message});res.json({accounts:data||[]});});
router.get("/audit",async(req,res)=>{const actor=await requireRole(req,res,["governor","chief_of_staff"]);if(!actor)return;const {data,error}=await supabaseAdmin.from("workforce_audit_log").select("id,actor_id,action,target_id,company_slug,details,created_at").order("created_at",{ascending:false}).limit(100);if(error)return res.status(500).json({error:error.message});res.json({audit:data||[]});});

export default router;