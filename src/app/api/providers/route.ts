import { NextRequest, NextResponse } from "next/server";
import { createGroqProvider } from "@/ai/groq";
import { createGeminiProvider } from "@/ai/gemini";
import { createOpenRouterProvider } from "@/ai/openrouter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, action } = body;

    if (!provider || !action) {
      return NextResponse.json(
        { error: "provider and action are required" },
        { status: 400 }
      );
    }

    const keyMap: Record<string, string | undefined> = {
      groq: process.env.GROQ_API_KEY,
      gemini: process.env.GEMINI_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
    };

    const modelMap: Record<string, string> = {
      groq: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      gemini: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      openrouter: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
    };

    const apiKey = keyMap[provider];
    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${provider}. Set ${provider.toUpperCase()}_API_KEY in environment variables.` },
        { status: 400 }
      );
    }

    const model = modelMap[provider];

    const createFn = {
      groq: createGroqProvider,
      gemini: createGeminiProvider,
      openrouter: createOpenRouterProvider,
    }[provider as "groq" | "gemini" | "openrouter"];

    if (!createFn) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }

    const instance = createFn(apiKey, model);

    if (action === "ping") {
      const result = await instance.ping();
      return NextResponse.json(result);
    }

    if (action === "listModels") {
      const models = await instance.listModels();
      return NextResponse.json({ models });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[API /providers]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
