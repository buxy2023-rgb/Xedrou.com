const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const SESSION_KEY = "xedruo_session";

function token() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null")?.access_token || ""; } catch { return ""; }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}), ...(options.headers || {}) },
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const companyPortal = {
  context: () => request("/api/company-portal/context"),
  pages: (company) => request(`/api/company-portal/site-pages?company=${encodeURIComponent(company)}`),
  savePage: (payload) => request("/api/company-portal/site-pages", { method: "POST", body: payload }),
  queries: (company) => request(`/api/company-portal/queries?company=${encodeURIComponent(company)}`),
  updateQuery: (id, status) => request(`/api/company-portal/queries/${id}`, { method: "PATCH", body: { status } }),
  financials: (company) => request(`/api/company-portal/financials?company=${encodeURIComponent(company)}`),
};
