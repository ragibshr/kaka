import { NextRequest, NextResponse } from "next/server";
import { chainChat } from "@/ai/chain";
import { CHAT_SYSTEM_PROMPT, buildChatContext } from "@/ai/prompts";
import type { ProviderConfig } from "@/ai/types";

function getProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "groq",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      enabled: true,
    });
  }

  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: "gemini",
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      enabled: true,
    });
  }

  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
      enabled: true,
    });
  }

  return providers;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, memories = [], todaySummary = "" } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const providers = getProviders();
    if (providers.length === 0) {
      return NextResponse.json(
        {
          error: "No AI providers configured. Set GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY in environment variables.",
        },
        { status: 503 }
      );
    }

    const context = buildChatContext(memories, todaySummary, messages);
    const systemPrompt = context
      ? `${CHAT_SYSTEM_PROMPT}\n\n${context}`
      : CHAT_SYSTEM_PROMPT;

    const result = await chainChat(providers, {
      system: systemPrompt,
      messages,
    });

    return NextResponse.json({
      text: result.text,
      provider: result.provider,
    });
  } catch (err) {
    console.error("[API /chat]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
