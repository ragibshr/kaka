import type { AIProvider, AIResponse, ProviderConfig } from "./types";
import { createGroqProvider } from "./groq";
import { createGeminiProvider } from "./gemini";
import { createOpenRouterProvider } from "./openrouter";
import { KakaError, AllProvidersFailedError } from "@/lib/errors";
import { logApiCall } from "@/lib/logger";

function createProvider(config: ProviderConfig): AIProvider {
  switch (config.name) {
    case "groq":
      return createGroqProvider(config.apiKey, config.model);
    case "gemini":
      return createGeminiProvider(config.apiKey, config.model);
    case "openrouter":
      return createOpenRouterProvider(config.apiKey, config.model);
  }
}

/** Retry-worthy status codes */
function isRetryable(err: unknown): boolean {
  if (err instanceof KakaError) {
    const s = err.status;
    return s === 0 || s === 401 || s === 403 || s === 404 || s === 429 || s >= 500;
  }
  return true; // network errors are retryable
}

/**
 * Try providers in order. On retryable failure, move to the next.
 * Returns the first successful response with the provider name.
 */
export async function chainChat(
  providers: ProviderConfig[],
  args: {
    system: string;
    messages: { role: "user" | "assistant"; content: string }[];
    temperature?: number;
  }
): Promise<AIResponse> {
  const enabled = providers.filter((p) => p.enabled && p.apiKey && p.model);
  if (enabled.length === 0) {
    throw new AllProvidersFailedError([
      {
        provider: "none",
        error: new KakaError({
          status: 0,
          message: "No AI providers configured. Go to Settings and add an API key.",
        }),
      },
    ]);
  }

  const errors: { provider: string; error: KakaError }[] = [];

  for (const config of enabled) {
    const provider = createProvider(config);
    const start = Date.now();
    try {
      const text = await provider.chat(args);
      logApiCall({
        provider: config.name,
        endpoint: "chat",
        status: 200,
        latencyMs: Date.now() - start,
        error: null,
      });
      return { text, provider: config.name };
    } catch (err) {
      const latencyMs = Date.now() - start;
      const kakaErr =
        err instanceof KakaError
          ? err
          : new KakaError({ status: 0, message: (err as Error).message });
      kakaErr.provider = config.name;

      logApiCall({
        provider: config.name,
        endpoint: "chat",
        status: kakaErr.status,
        latencyMs,
        error: kakaErr.message,
      });

      errors.push({ provider: config.name, error: kakaErr });

      if (!isRetryable(err)) continue;
    }
  }

  throw new AllProvidersFailedError(errors);
}

/**
 * Try providers for JSON extraction.
 */
export async function chainJson(
  providers: ProviderConfig[],
  args: {
    system: string;
    user: string;
    temperature?: number;
  }
): Promise<AIResponse> {
  const enabled = providers.filter((p) => p.enabled && p.apiKey && p.model);
  if (enabled.length === 0) {
    throw new AllProvidersFailedError([
      {
        provider: "none",
        error: new KakaError({
          status: 0,
          message: "No AI providers configured.",
        }),
      },
    ]);
  }

  const errors: { provider: string; error: KakaError }[] = [];

  for (const config of enabled) {
    const provider = createProvider(config);
    const start = Date.now();
    try {
      const text = await provider.json(args);
      logApiCall({
        provider: config.name,
        endpoint: "json",
        status: 200,
        latencyMs: Date.now() - start,
        error: null,
      });
      return { text, provider: config.name };
    } catch (err) {
      const latencyMs = Date.now() - start;
      const kakaErr =
        err instanceof KakaError
          ? err
          : new KakaError({ status: 0, message: (err as Error).message });
      kakaErr.provider = config.name;

      logApiCall({
        provider: config.name,
        endpoint: "json",
        status: kakaErr.status,
        latencyMs,
        error: kakaErr.message,
      });

      errors.push({ provider: config.name, error: kakaErr });
    }
  }

  throw new AllProvidersFailedError(errors);
}

export { createProvider };
