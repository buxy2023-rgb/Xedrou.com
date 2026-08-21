import { Router } from "express";
import crypto from "crypto";
import { supabaseAdmin } from "../config/supabase";

const router = Router();
const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";
const stateSecret = () => process.env.GOOGLE_OAUTH_STATE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "xedruo-google-state";
const callbackUrl = () => process.env.GOOGLE_CALLBACK_URL || "https://xedruo-web.onrender.com/api/auth/google/callback";
const frontend = () => String(process.env.FRONTEND_ORIGIN || "https://xedruo-web.onrender.com").split(",")[0].trim();
const sign = (value:string) => crypto.createHmac("sha256", stateSecret()).update(value).digest("base64url");
const hashToken = (t:string) => crypto.createHash("sha256").update(t).digest("hex");

router.get("/google", (req,res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({error:"Google authentication is not configured"});
  const service = String(req.query.service || "").trim().slice(0,100);
  const requestedRole = String(req.query.role || "").trim().slice(0,50);
  const allowedRoles = new Set(["governor","chief_of_staff","developer"]);
  if (service === "workforce" && !allowedRoles.has(requestedRole)) return res.status(400).json({error:"Choose a valid workforce role"});
  const nonce = crypto.randomBytes(18).toString("base64url");
  const payload = Buffer.from(JSON.stringify({nonce,service,requestedRole,ts:Date.now()})).toString("base64url");
  const state = `${payload}.${sign(payload)}`;
  const params = new URLSearchParams({client_id:clientId,redirect_uri:callbackUrl(),response_type:"code",scope:"openid email profile",access_type:"online",prompt:"select_account",state});
  res.redirect(`${GOOGLE_AUTH}?${params.toString()}`);
});

router.get("/google/callback", async (req,res) => {
  try {
    const code = String(req.query.code || "");
    const rawState = String(req.query.state || "");
    if (!code || !rawState.includes(".")) return res.status(400).send("Google authentication failed");
    const [payload,signature] = rawState.split(".");
    const expected = sign(payload);
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected))) return res.status(400).send("Invalid authentication state");
    const state = JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
    if (!state.ts || Date.now()-Number(state.ts)>10*60*1000) return res.status(400).send("Authentication request expired");
    const clientId=process.env.GOOGLE_CLIENT_ID, clientSecret=process.env.GOOGLE_CLIENT_SECRET;
    if(!clientId || !clientSecret) return res.status(503).send("Google authentication is not fully configured");
    const tokenResponse = await fetch(GOOGLE_TOKEN,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:callbackUrl(),grant_type:"authorization_code"})});
    const tokens:any=await tokenResponse.json().catch(()=>({})); if(!tokenResponse.ok) return res.status(401).send("Google token verification failed");
    const userResponse=await fetch(GOOGLE_USERINFO,{headers:{Authorization:`Bearer ${tokens.access_token}`}}); const google:any=await userResponse.json().catch(()=>({}));
    if(!userResponse.ok || !google.email || !google.email_verified) return res.status(401).send("Google account email could not be verified");
    const email=String(google.email).toLowerCase();

    if (state.service === "workforce") {
      // Workforce Google access intentionally accepts the user's own verified Google/Gmail account.
      // The selected role determines the destination; no pre-registered Xedruo email is required.
      const role = String(state.requestedRole || "");
      const token = Buffer.from(JSON.stringify({email,name:google.name||email,picture:google.picture||"",role,company_slug:"xedruo",iat:Date.now()})).toString("base64url");
      return res.redirect(`${frontend()}/auth/google/complete?workforce_token=${encodeURIComponent(token)}`);
    }

    await supabaseAdmin.from("profiles").upsert({id:google.sub,email,role:"user",full_name:google.name||null},{onConflict:"id"});
    const ticket=Buffer.from(JSON.stringify({email,name:google.name||"",picture:google.picture||"",role:"customer",destination:"customer",service:state.service||null,iat:Date.now()})).toString("base64url");
    const target=`${frontend()}/auth/google/complete?ticket=${encodeURIComponent(ticket)}&service=${encodeURIComponent(state.service||"")}`;
    res.redirect(target);
  } catch(err){ console.error("Google OAuth callback failed",err); res.status(500).send("Google authentication failed"); }
});

export default router;
