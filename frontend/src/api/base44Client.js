/**
 * Drop-in replacement for the old `@base44/sdk` client.
 *
 * Every page/component in this app still does:
 *   import { base44 } from '@/api/base44Client';
 *   base44.entities.Song.list(...)
 *   base44.auth.me()
 *   base44.integrations.Core.InvokeLLM(...)
 *
 * ...exactly as before. Nothing in src/screens or src/components changed.
 *
 * FULL BACKEND INDEPENDENCE: this file only ever talks to our own Express API
 * (NEXT_PUBLIC_API_URL). It never imports @supabase/supabase-js and never calls
 * Supabase directly — Express is the one and only backend the browser depends on.
 * Auth, entity CRUD, realtime, and integrations (LLM/upload/email/transcription)
 * all go through Express, which is the only thing that talks to Supabase.
 */
import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const STORAGE_KEY = "xedruo_session";

let session = null;
let refreshing = null;
const listeners = new Set();

function loadSession() {
  if (session) return session;
  if (typeof window === "undefined") return null;
  try { const raw = window.localStorage.getItem(STORAGE_KEY); session = raw ? JSON.parse(raw) : null; }
  catch { session = null; }
  return session;
}

function saveSession(next) {
  session = next;
  if (typeof window !== "undefined") {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((cb) => cb(next));
}

function onAuthStateChanged(cb) { listeners.add(cb); return () => listeners.delete(cb); }

async function refreshSession() {
  const current = loadSession();
  if (!current?.refresh_token) return null;
  if (!refreshing) {
    refreshing = fetch(`${API_URL}/api/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: current.refresh_token }) })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { saveSession(data?.session || null); return data?.session || null; })
      .catch(() => { saveSession(null); return null; })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

async function apiFetch(path, { method = "GET", body, headers, isForm, _retried } = {}) {
  const current = loadSession();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), ...(current?.access_token ? { Authorization: `Bearer ${current.access_token}` } : {}), ...headers },
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !_retried && current?.refresh_token) {
    const refreshed = await refreshSession();
    if (refreshed) return apiFetch(path, { method, body, headers, isForm, _retried: true });
  }
  if (!res.ok) {
    let data;
    try { data = await res.json(); } catch { data = { error: res.statusText }; }
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status; err.data = data; throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

let socket = null;
function getSocket() {
  if (socket) return socket;
  const current = loadSession();
  socket = io(API_URL, { auth: { token: current?.access_token }, autoConnect: !!current?.access_token });
  return socket;
}
onAuthStateChanged((next) => {
  if (socket) { socket.disconnect(); socket = null; }
  if (next?.access_token) getSocket().connect();
});

function makeEntityClient(entityName) {
  const base = `/api/entities/${entityName}`;
  return {
    list: (sort, limit) => { const params = new URLSearchParams(); if (sort) params.set("sort", sort); if (limit) params.set("limit", String(limit)); return apiFetch(`${base}?${params.toString()}`); },
    filter: (query = {}, sort, limit) => { const params = new URLSearchParams(); params.set("filter", JSON.stringify(query)); if (sort) params.set("sort", sort); if (limit) params.set("limit", String(limit)); return apiFetch(`${base}?${params.toString()}`); },
    get: (id) => apiFetch(`${base}/${id}`),
    create: (data) => apiFetch(base, { method: "POST", body: data }),
    update: (id, data) => apiFetch(`${base}/${id}`, { method: "PUT", body: data }),
    delete: (id) => apiFetch(`${base}/${id}`, { method: "DELETE" }),
    bulkUpdate: (items) => apiFetch(`${base}/bulk-update`, { method: "POST", body: items }),
    subscribe: (callback) => {
      const s = getSocket(); const tableEvent = `change:${entityName}`; const handler = (payload) => callback(payload);
      const join = () => s.emit("subscribe", entityTable(entityName)); s.on("connect", join); if (s.connected) join(); s.on(tableEvent, handler);
      return () => { s.off(tableEvent, handler); s.off("connect", join); s.emit("unsubscribe", entityTable(entityName)); };
    },
  };
}

function toSnakeCase(str) { return str.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z])([A-Z][a-z])/g, "$1_$2").toLowerCase(); }
function entityTable(entityName) { if (entityName === "User") return "user_profiles"; return toSnakeCase(entityName) + "s"; }

const entityCache = {};
const entities = new Proxy({}, { get(_target, entityName) { if (typeof entityName !== "string") return undefined; if (!entityCache[entityName]) entityCache[entityName] = makeEntityClient(entityName); return entityCache[entityName]; } });

const auth = {
  isAuthenticated: async () => !!loadSession()?.access_token,
  me: async () => { if (!loadSession()?.access_token) { const err = new Error("Not authenticated"); err.status = 401; throw err; } return apiFetch("/api/auth/me"); },
  loginViaEmailPassword: async (email, password) => { const data = await apiFetch("/api/auth/login", { method: "POST", body: { email, password } }); saveSession(data.session); },
  loginWithProvider: async (provider, redirectPath = "/dashboard") => { const { url } = await apiFetch(`/api/auth/oauth-url?provider=${encodeURIComponent(provider)}&redirect_path=${encodeURIComponent(redirectPath)}`); window.location.href = url; },
  register: async ({ email, password }) => { const data = await apiFetch("/api/auth/register", { method: "POST", body: { email, password } }); if (data.session) saveSession(data.session); return data; },
  verifyOtp: async ({ email, otpCode }) => { const data = await apiFetch("/api/auth/verify-otp", { method: "POST", body: { email, otpCode } }); saveSession(data.session); return { access_token: data.session?.access_token }; },
  resendOtp: async (email) => apiFetch("/api/auth/resend-otp", { method: "POST", body: { email } }),
  resetPasswordRequest: async (email) => apiFetch("/api/auth/reset-password-request", { method: "POST", body: { email } }),
  resetPassword: async ({ newPassword }) => { const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, "")); const recoveryAccessToken = hashParams.get("access_token"); return apiFetch("/api/auth/reset-password", { method: "POST", body: { recoveryAccessToken, newPassword } }); },
  setToken: async (accessToken) => { const current = loadSession() || {}; saveSession({ ...current, access_token: accessToken }); return accessToken; },
  logout: async (redirectTo) => { try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch {} saveSession(null); if (redirectTo) window.location.href = "/login"; },
  redirectToLogin: (returnTo) => { const url = new URL("/login", window.location.origin); if (returnTo) url.searchParams.set("from_url", returnTo); window.location.href = url.toString(); },
  _saveSession: saveSession,
  _onAuthStateChanged: onAuthStateChanged,
};

const integrations = {
  Core: {
    UploadFile: async ({ file }) => { const form = new FormData(); form.append("file", file); return apiFetch("/api/integrations/upload-file", { method: "POST", body: form, isForm: true }); },
    InvokeLLM: async ({ prompt, system, response_json_schema }) => { const data = await apiFetch("/api/integrations/invoke-llm", { method: "POST", body: { prompt, system, response_json_schema } }); return data.response; },
    SendEmail: async ({ to, subject, body }) => apiFetch("/api/integrations/send-email", { method: "POST", body: { to, subject, body } }),
    TranscribeAudio: async ({ audio_url }) => { const data = await apiFetch("/api/integrations/transcribe-audio", { method: "POST", body: { audio_url } }); return data.text; },
  },
};

const companyAI = {
  memory: async (company) => apiFetch(`/api/company-ai/memory?company=${encodeURIComponent(company)}`),
  chat: async ({ company, companyType, userMessage }) => apiFetch("/api/company-ai/chat", { method: "POST", body: { company, companyType, userMessage } }),
  clearMemory: async (company) => apiFetch(`/api/company-ai/memory?company=${encodeURIComponent(company)}`, { method: "DELETE" }),
};

export const base44 = { auth, entities, integrations, companyAI };