export type LocalAiResult = { text: string; provider: "xedruo-local"; model: string };

const env = (name: string) => process.env[name]?.trim() || "";

/**
 * OpenAI-compatible self-hosted AI adapter.
 * Point XEDRUO_LOCAL_AI_URL at Ollama, vLLM, llama.cpp server, or another
 * compatible endpoint. No paid provider is required for this layer.
 */
export async function callLocalAi(instructions: string, input: string): Promise<LocalAiResult> {
  const baseUrl = env("XEDRUO_LOCAL_AI_URL");
  if (!baseUrl) throw new Error("XEDRUO_LOCAL_AI_URL is not configured");

  const url = `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
  const model = env("XEDRUO_LOCAL_AI_MODEL") || "local-model";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = env("XEDRUO_LOCAL_AI_KEY");
  if (key) headers.Authorization = `Bearer ${key}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: input },
      ],
      temperature: Number(env("XEDRUO_LOCAL_AI_TEMPERATURE") || 0.2),
      max_tokens: Number(env("AI_MAX_OUTPUT_TOKENS") || 4000),
      stream: false,
    }),
  });

  const body: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Local AI request failed (${response.status})`);
  const text = body?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Local AI returned no text");
  return { text, provider: "xedruo-local", model: body?.model || model };
}

export function localAiStatus() {
  return {
    connected: Boolean(env("XEDRUO_LOCAL_AI_URL")),
    model: env("XEDRUO_LOCAL_AI_MODEL") || "local-model",
    cost: 0,
    mode: "self-hosted",
  };
}
