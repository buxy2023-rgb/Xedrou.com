const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const STORAGE_KEY = "xedruo_session";
async function request(path, options = {}) {
  let session = null;
  if (typeof window !== "undefined") { try { session = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null"); } catch { session = null; } }
  const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 207) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
export const developerClient = {
  listProjects: () => request("/api/developer/projects"),
  getProject: (id) => request(`/api/developer/projects/${encodeURIComponent(id)}`),
  listPlugins: () => request("/api/developer/plugins"),
  promptProject: (id, prompt) => request(`/api/developer/projects/${encodeURIComponent(id)}/prompt`, { method: "POST", body: JSON.stringify({ prompt }) }),
  executePlan: (id, prompt, plan) => request(`/api/developer/projects/${encodeURIComponent(id)}/execute`, { method: "POST", body: JSON.stringify({ prompt, plan }) }),
  advanceProject: (id, payload) => request(`/api/developer/projects/${encodeURIComponent(id)}/advance`, { method: "POST", body: JSON.stringify(payload) }),
};
