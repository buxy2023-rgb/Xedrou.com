const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://xedruo-backend.onrender.com";

export async function completeXedruoRegistration({ country_code, currency_code, time_zone, locale = "en" }) {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem("xedruo_session") : null;
  const session = raw ? JSON.parse(raw) : null;
  if (!session?.access_token) throw new Error("Your Google session has expired. Please sign in again.");

  const response = await fetch(`${API_URL}/api/registration/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ country_code, currency_code, time_zone, locale }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Unable to complete Xedruo registration.");
  return data.xedruo_user;
}
