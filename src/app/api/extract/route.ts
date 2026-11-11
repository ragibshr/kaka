import { NextRequest, NextResponse } from "next/server";
import { chainJson } from "@/ai/chain";
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserContent,
} from "@/ai/prompts";
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
    const { message, timezone = "Asia/Dubai" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message string is required" },
        { status: 400 }
      );
    }

    const providers = getProviders();
    if (providers.length === 0) {
      return NextResponse.json(
        { error: "No AI providers configured." },
        { status: 503 }
      );
    }

    const userContent = buildExtractionUserContent(message, timezone);

    const result = await chainJson(providers, {
      system: EXTRACTION_SYSTEM_PROMPT,
      user: userContent,
    });

    // Try to parse the JSON response
    let parsed;
    try {
      // Strip code fences if present
      let cleaned = result.text.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      // Return raw text so the client can attempt repair
      return NextResponse.json({
        items: [],
        raw: result.text,
        provider: result.provider,
        parseError: true,
      });
    }

    return NextResponse.json({
      items: parsed.items || [],
      provider: result.provider,
      parseError: false,
    });
  } catch (err) {
    console.error("[API /extract]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
