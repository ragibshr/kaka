import type { AIProvider } from "./types";
import { http } from "@/lib/http";

export function createGeminiProvider(
  apiKey: string,
  model: string
): AIProvider {
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  const headers = {
    "x-goog-api-key": apiKey,
  };

  function buildContents(
    messages: { role: "user" | "assistant" | "system"; content: string }[]
  ) {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
  }

  return {
    name: "gemini",

    async chat({ system, messages, temperature = 0.7, signal }) {
      const result = await http<{
        candidates: { content: { parts: { text: string }[] } }[];
      }>({
        url: `${baseUrl}/models/${model}:generateContent`,
        method: "POST",
        headers,
        body: {
          systemInstruction: { parts: [{ text: system }] },
          contents: buildContents(
            messages.map((m) => ({ ...m }))
          ),
          generationConfig: { temperature },
        },
        timeoutMs: 30000,
        signal,
      });
      return result.data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    },

    async json({ system, user, temperature = 0.2, signal }) {
      const result = await http<{
        candidates: { content: { parts: { text: string }[] } }[];
      }>({
        url: `${baseUrl}/models/${model}:generateContent`,
        method: "POST",
        headers,
        body: {
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
          },
        },
        timeoutMs: 30000,
        signal,
      });
      return result.data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    },

    async listModels() {
      const result = await http<{
        models: { name: string; supportedGenerationMethods: string[] }[];
      }>({
        url: `${baseUrl}/models`,
        method: "GET",
        headers,
      });
      return result.data.models
        .filter((m) =>
          m.supportedGenerationMethods?.includes("generateContent")
        )
        .map((m) => m.name.replace("models/", ""))
        .sort();
    },

    async ping() {
      const start = Date.now();
      try {
        await http({
          url: `${baseUrl}/models/${model}:generateContent`,
          method: "POST",
          headers,
          body: {
            contents: [{ role: "user", parts: [{ text: "ping" }] }],
            generationConfig: { maxOutputTokens: 5 },
          },
          timeoutMs: 10000,
        });
        return { ok: true, latencyMs: Date.now() - start };
      } catch (err) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: (err as Error).message,
        };
      }
    },
  };
}
