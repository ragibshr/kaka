import type { SupabaseClient } from "@supabase/supabase-js";

/** Store one AI call in the api_log table (shown on the Diagnostics page). Never throws. */
export async function logApiCall(
  supabase: SupabaseClient,
  entry: { provider: string; endpoint: string; status: number | null; latencyMs: number; error: string | null }
) {
  try {
    await supabase.from("api_log").insert({
      provider: entry.provider,
      endpoint: entry.endpoint,
      status: entry.status,
      latency_ms: entry.latencyMs,
      error: entry.error?.slice(0, 1000) ?? null,
    });
  } catch {
    // logging must never break the app
  }
}
