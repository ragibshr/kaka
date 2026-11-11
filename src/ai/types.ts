// AI Provider interface — all providers implement this
export interface AIProvider {
  name: "groq" | "gemini" | "openrouter";
  chat(args: {
    system: string;
    messages: { role: "user" | "assistant"; content: string }[];
    temperature?: number;
    signal?: AbortSignal;
  }): Promise<string>;
  json(args: {
    system: string;
    user: string;
    temperature?: number;
    signal?: AbortSignal;
  }): Promise<string>;
  listModels(): Promise<string[]>;
  ping(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}

export interface AIResponse {
  text: string;
  provider: "groq" | "gemini" | "openrouter";
}

export interface ProviderConfig {
  name: "groq" | "gemini" | "openrouter";
  apiKey: string;
  model: string;
  enabled: boolean;
}
