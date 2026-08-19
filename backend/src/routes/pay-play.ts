import { Router } from "express";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "../config/supabase";
import { AuthedRequest, requireAuth } from "../middleware/auth";

const router = Router();

const SERVICES: Record<string, string> = {
  "pay-and-play": "Pay & Play",
  sportruo: "Sportruo",
  hireuo: "Hireuo",
  adom: "Adom",
  agruo: "Agruo",
  healthruo: "Healthruo",
  "xedruo-education": "Xedruo Education",
  "xedruo-capital": "Xedruo Capital",
  "xedruo-energy": "Xedruo Energy",
  "xedruo-logistics": "Xedruo Logistics",
  "xedruo-properties": "Xedruo Properties",
  spacetruo: "Spacetruo",
  "enit-ai": "Enit AI",
  xedruo: "Xedruo",
};

function serviceName(slug: string) {
  return SERVICES[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

router.get("/overview", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const { data: account, error: accountError } = await supabaseAdmin
    .from("pay_play_accounts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (accountError) return res.status(500).json({ error: accountError.message });
  if (!account) return res.json({ provisioned: false, services: SERVICES });

  const [balances, connections, transactions, notifications, cards, subscriptions] = await Promise.all([
    supabaseAdmin.from("pay_play_balances").select("*").eq("account_id", account.id).order("is_primary", { ascending: false }),
    supabaseAdmin.from("pay_play_service_connections").select("*").eq("account_id", account.id).order("created_at"),
    supabaseAdmin.from("pay_play_transactions").select("*").eq("account_id", account.id).order("created_at", { ascending: false }).limit(30),
    supabaseAdmin.from("pay_play_notifications").select("*").eq("account_id", account.id).order("created_at", { ascending: false }).limit(20),
    supabaseAdmin.from("pay_play_cards").select("id,card_type,last4,status,created_at").eq("account_id", account.id).order("created_at", { ascending: false }),
    supabaseAdmin.from("pay_play_subscriptions").select("*").eq("account_id", account.id).eq("status", "active"),
  ]);

  res.json({
    provisioned: true,
    account,
    balances: balances.data || [],
    services: connections.data || [],
    transactions: transactions.data || [],
    notifications: notifications.data || [],
    cards: cards.data || [],
    subscriptions: subscriptions.data || [],
    serviceCatalog: SERVICES,
  });
});

router.post("/provision", requireAuth, async (req: AuthedRequest, res) => {
  const phone = String(req.body?.phone || "").trim();
  const countryCode = String(req.body?.countryCode || "NG").trim().toUpperCase();
  const companySlug = String(req.body?.companySlug || "pay-and-play").trim().toLowerCase();
  if (!phone) return res.status(400).json({ error: "Phone number is required to create the Xedruo account number." });
  if (!SERVICES[companySlug]) return res.status(400).json({ error: "Unknown Xedruo company/service." });

  const { data, error } = await supabaseAdmin.rpc("provision_pay_play_account", {
    p_user_id: req.user!.id,
    p_phone: phone,
    p_country_code: countryCode,
    p_company_slug: companySlug,
    p_company_name: serviceName(companySlug),
  });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ ...data, ready: true, notification: "Xedruo Pay & Play is ready." });
});

router.post("/connect-service", requireAuth, async (req: AuthedRequest, res) => {
  const companySlug = String(req.body?.companySlug || "").trim().toLowerCase();
  if (!SERVICES[companySlug]) return res.status(400).json({ error: "Unknown Xedruo service." });
  const { data: account } = await supabaseAdmin.from("pay_play_accounts").select("id,xedruo_id").eq("user_id", req.user!.id).maybeSingle();
  if (!account) return res.status(400).json({ error: "Create Pay & Play first." });

  const serviceAccountNumber = `XPP-${account.xedruo_id}-${Math.floor(10000 + Math.random() * 90000)}`;
  const companyRegistrationNumber = `XPP-${companySlug.replace(/[^a-z0-9]/g, "").slice(0, 8).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const { data, error } = await supabaseAdmin.from("pay_play_service_connections").upsert({
    account_id: account.id,
    company_slug: companySlug,
    company_name: serviceName(companySlug),
    service_account_number: serviceAccountNumber,
    company_registration_number: companyRegistrationNumber,
    subscribed: true,
    status: "active",
  }, { onConflict: "account_id,company_slug", ignoreDuplicates: false }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.post("/transfer", requireAuth, async (req: AuthedRequest, res) => {
  const recipient = String(req.body?.recipient || "").trim();
  const amount = Number(req.body?.amount || 0);
  const currency = String(req.body?.currency || "NGN").toUpperCase();
  const description = String(req.body?.description || "Xedruo transfer").trim();
  if (!recipient || !Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Recipient and a valid amount are required." });
  const { data, error } = await supabaseAdmin.rpc("pay_play_transfer", {
    p_sender_user_id: req.user!.id,
    p_recipient: recipient,
    p_amount: amount,
    p_currency: currency,
    p_description: description,
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post("/order", requireAuth, async (req: AuthedRequest, res) => {
  const serviceType = String(req.body?.serviceType || "other");
  const companySlug = String(req.body?.companySlug || "pay-and-play");
  const title = String(req.body?.title || serviceName(companySlug));
  const amount = Number(req.body?.amount || 0);
  const currency = String(req.body?.currency || "NGN").toUpperCase();
  const { data: account } = await supabaseAdmin.from("pay_play_accounts").select("id").eq("user_id", req.user!.id).maybeSingle();
  if (!account) return res.status(400).json({ error: "Create Pay & Play first." });
  const { data, error } = await supabaseAdmin.from("pay_play_orders").insert({ account_id: account.id, company_slug: companySlug, service_type: serviceType, title, amount, currency, status: "requested", metadata: req.body?.metadata || {} }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.post("/music/booking", requireAuth, async (req: AuthedRequest, res) => {
  const { data: account } = await supabaseAdmin.from("pay_play_accounts").select("id").eq("user_id", req.user!.id).maybeSingle();
  if (!account) return res.status(400).json({ error: "Create Pay & Play first." });
  const { data, error } = await supabaseAdmin.from("pay_play_music_bookings").insert({
    account_id: account.id,
    artist_id: String(req.body?.artistId || "unknown"),
    artist_name: String(req.body?.artistName || "Artist"),
    booking_kind: String(req.body?.bookingKind || "ticket"),
    event_date: req.body?.eventDate || null,
    venue: req.body?.venue || null,
    quantity: Number(req.body?.quantity || 1),
    amount: Number(req.body?.amount || 0),
    currency: String(req.body?.currency || "NGN").toUpperCase(),
    status: "requested",
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.post("/kyc", requireAuth, async (req: AuthedRequest, res) => {
  const { data: account } = await supabaseAdmin.from("pay_play_accounts").select("id").eq("user_id", req.user!.id).maybeSingle();
  if (!account) return res.status(400).json({ error: "Create Pay & Play first." });
  const { data, error } = await supabaseAdmin.from("pay_play_kyc_requests").insert({ account_id: account.id, document_type: req.body?.documentType || null, country_code: req.body?.countryCode || null, status: "pending" }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await supabaseAdmin.from("pay_play_accounts").update({ kyc_status: "pending" }).eq("id", account.id);
  res.status(201).json(data);
});

router.post("/card", requireAuth, async (req: AuthedRequest, res) => {
  const { data: account } = await supabaseAdmin.from("pay_play_accounts").select("id").eq("user_id", req.user!.id).maybeSingle();
  if (!account) return res.status(400).json({ error: "Create Pay & Play first." });
  const { data, error } = await supabaseAdmin.from("pay_play_cards").insert({ account_id: account.id, card_type: req.body?.cardType === "physical" ? "physical" : "virtual", status: "requested" }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.post("/subscription", requireAuth, async (req: AuthedRequest, res) => {
  const { data: account } = await supabaseAdmin.from("pay_play_accounts").select("id").eq("user_id", req.user!.id).maybeSingle();
  if (!account) return res.status(400).json({ error: "Create Pay & Play first." });
  const companySlug = String(req.body?.companySlug || "");
  if (!SERVICES[companySlug]) return res.status(400).json({ error: "Unknown Xedruo service." });
  const { data, error } = await supabaseAdmin.from("pay_play_subscriptions").upsert({ account_id: account.id, company_slug: companySlug, plan_name: String(req.body?.planName || "standard"), status: "active" }, { onConflict: "account_id,company_slug,plan_name" }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.get("/services", (_req, res) => res.json({ services: Object.entries(SERVICES).map(([slug, name]) => ({ slug, name })) }));

router.get("/health", (_req, res) => res.json({ status: "ok", service: "pay-and-play", requestId: randomUUID() }));

export default router;
