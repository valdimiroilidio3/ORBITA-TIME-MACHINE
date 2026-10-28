import { config } from "../config";

export interface AiCallOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface AiCallResult {
  engine: "remote" | "local";
  ok: boolean;
  text: string;
  error: string | null;
  provider: string | null;
  model: string | null;
  costCents: number;
}

export type AIProvider = "openai" | "anthropic" | "local";

export function resolveProvider(): { provider: AIProvider; baseUrl: string; model: string } {
  const explicit = config.ai.provider;
  const key = config.ai.apiKey;
  let provider: AIProvider = "local";
  if (explicit === "openai" || explicit === "anthropic") {
    provider = key ? explicit : "local";
  } else if (explicit === "auto" && key) {
    provider = key.startsWith("sk-ant") || config.ai.baseUrl.includes("anthropic") ? "anthropic" : "openai";
  }
  const baseUrl =
    config.ai.baseUrl ||
    (provider === "anthropic" ? "https://api.anthropic.com/v1" : "https://api.openai.com/v1");
  const model =
    config.ai.model ||
    (provider === "anthropic" ? "claude-3-5-sonnet-latest" : "gpt-4o-mini");
  return { provider, baseUrl: baseUrl.replace(/\/$/, ""), model };
}

export function aiAvailable(): boolean {
  return resolveProvider().provider !== "local";
}

function estimateCost(text: string): number {
  // Aproximação conservadora: 1 cêntimo por cada 1.500 caracteres de saída.
  return Math.max(1, Math.ceil(text.length / 1500));
}

/**
 * Chamada ao fornecedor de IA configurado. Nunca expõe a chave ao frontend.
 * Falhas de rede/timeout devolvem `ok: false` — o pipeline usa o motor local
 * determinístico e regista o motivo, em vez de falhar a geração inteira.
 */
export async function callAi(options: AiCallOptions): Promise<AiCallResult> {
  const { provider, baseUrl, model } = resolveProvider();
  if (provider === "local") {
    return {
      engine: "local",
      ok: false,
      text: "",
      error: "Sem fornecedor remoto configurado (AI_API_KEY ausente).",
      provider: null,
      model: null,
      costCents: 0,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.ai.timeoutMs);
  options.signal?.addEventListener("abort", () => controller.abort());

  try {
    if (provider === "anthropic") {
      const response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          "x-api-key": config.ai.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: options.maxTokens ?? config.ai.maxOutputTokens,
          system: options.system,
          messages: [{ role: "user", content: options.prompt }],
        }),
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300);
        return {
          engine: "local",
          ok: false,
          text: "",
          error: `Fornecedor IA respondeu ${response.status}: ${detail}`,
          provider,
          model,
          costCents: 0,
        };
      }
      const data = (await response.json()) as {
        content?: { type: string; text?: string }[];
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const text = (data.content ?? [])
        .filter((block) => block.type === "text")
        .map((block) => block.text ?? "")
        .join("\n");
      const tokens = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
      return {
        engine: "remote",
        ok: true,
        text,
        error: null,
        provider,
        model,
        costCents: Math.max(estimateCost(text), Math.ceil(tokens / 6000)),
      };
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens ?? config.ai.maxOutputTokens,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.prompt },
        ],
      }),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      return {
        engine: "local",
        ok: false,
        text: "",
        error: `Fornecedor IA respondeu ${response.status}: ${detail}`,
        provider,
        model,
        costCents: 0,
      };
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    return {
      engine: "remote",
      ok: text.length > 0,
      text,
      error: text.length > 0 ? null : "Resposta vazia do fornecedor de IA.",
      provider,
      model,
      costCents: Math.max(estimateCost(text), Math.ceil((data.usage?.total_tokens ?? 0) / 6000)),
    };
  } catch (error) {
    return {
      engine: "local",
      ok: false,
      text: "",
      error: `Falha de rede/timeout no fornecedor de IA: ${(error as Error).message}`,
      provider,
      model,
      costCents: 0,
    };
  } finally {
    clearTimeout(timer);
  }
}
