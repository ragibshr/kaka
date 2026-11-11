import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isGeminiConfigured, pingGemini } from "@/ai/gemini";
import { logApiCall } from "@/lib/logger";

/** Settings page "Test" button: checks the database and Gemini for real. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const db = await auth.supabase.from("messages").select("id", { count: "exact", head: true });
  const ai = isGeminiConfigured()
    ? await pingGemini()
    : { ok: false, error: "GEMINI_API_KEY সেট করা নেই" };

  void logApiCall(auth.supabase, {
    provider: "model" in ai && ai.model ? ai.model : "gemini",
    endpoint: "health",
    status: ai.ok ? 200 : 500,
    latencyMs: "latencyMs" in ai && ai.latencyMs ? ai.latencyMs : 0,
    error: ai.ok ? null : ai.error ?? null,
  });

  return NextResponse.json({
    database: { ok: !db.error, messageCount: db.count ?? 0, error: db.error?.message },
    gemini: ai,
    models: {
      primary: process.env.GEMINI_MODEL || "gemini-flash-latest",
      fallback: process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest",
    },
  });
}
