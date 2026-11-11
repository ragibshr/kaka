import "server-only";
import { http } from "@/lib/http";
import { KakaError } from "@/lib/errors";
import type { ChatMessage, GenerateResult } from "./types";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

/** Models to try in order. Aliases always point to Google's current Flash models. */
function modelChain(): string[] {
  const primary = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const fallback = process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest";
  return primary === fallback ? [primary] : [primary, fallback];
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new KakaError({
      status: 0,
      message: "GEMINI_API_KEY সেট করা নেই। .env.local ফাইলে key বসাও।",
    });
  }
  return key;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
};

/** Retry on rate-limit / server errors, then move to the next model. */
function shouldTryNext(err: unknown): boolean {
  if (!(err instanceof KakaError)) return true;
  return err.status === 0 || err.status === 404 || err.status === 429 || err.status >= 500;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generate(args: {
  system: string;
  messages: ChatMessage[];
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<GenerateResult> {
  const key = apiKey();
  const errors: string[] = [];
  const failures: GenerateResult["failures"] = [];

  for (const model of modelChain()) {
    let useThinkingConfig = true;
    for (let attempt = 0; attempt < 3; attempt++) {
      const start = Date.now();
      try {
        const res = await http<GeminiResponse>({
          url: `${BASE_URL}/models/${model}:generateContent`,
          method: "POST",
          headers: { "x-goog-api-key": key },
          body: {
            systemInstruction: { parts: [{ text: args.system }] },
            contents: args.messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: {
              temperature: args.temperature ?? (args.json ? 0.1 : 0.7),
              maxOutputTokens: args.maxOutputTokens ?? 2048,
              ...(args.json ? { responseMimeType: "application/json" } : {}),
              // Kaka needs quick answers, not deep reasoning — keep "thinking" low
              ...(useThinkingConfig ? { thinkingConfig: { thinkingLevel: "low" } } : {}),
            },
          },
          timeoutMs: 25000,
        });
        const text =
          res.data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
        if (!text) {
          const reason =
            res.data.promptFeedback?.blockReason ||
            res.data.candidates?.[0]?.finishReason ||
            "empty";
          throw new KakaError({ status: 0, message: `Gemini খালি উত্তর দিয়েছে (${reason})` });
        }
        return { text, model, latencyMs: Date.now() - start, failures };
      } catch (err) {
        const e = err instanceof KakaError ? err : new KakaError({ status: 0, message: String(err) });
        const detail = `${e.message}${e.bodySnippet ? ` ${e.bodySnippet}` : ""}`;
        errors.push(`${model}: ${detail}`);
        failures.push({ model, status: e.status, latencyMs: Date.now() - start, error: detail });
        // Model doesn't accept thinkingConfig → retry same model without it
        if (e.status === 400 && useThinkingConfig && /thinking/i.test(detail)) {
          useThinkingConfig = false;
          continue;
        }
        if (!shouldTryNext(e)) {
          throw new KakaError({ status: e.status, message: errors.join(" | ") });
        }
        if (e.status === 429 && attempt < 2 && failures.filter((f) => f.model === model && f.status === 429).length === 1) {
          await sleep(1500);
          continue;
        }
        break; // next model
      }
    }
  }
  throw new KakaError({ status: 503, message: `সব Gemini মডেল ব্যর্থ: ${errors.join(" | ")}` });
}

/** Parse JSON from a model reply, tolerating ```json fences. */
export function parseJson<T = unknown>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned) as T;
}

export async function pingGemini(): Promise<{ ok: boolean; model?: string; latencyMs?: number; error?: string }> {
  try {
    const r = await generate({
      system: "Reply with the single word: ok",
      messages: [{ role: "user", content: "ping" }],
      maxOutputTokens: 200,
      temperature: 0,
    });
    return { ok: true, model: r.model, latencyMs: r.latencyMs };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
