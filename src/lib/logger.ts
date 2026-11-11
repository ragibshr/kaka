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

/** Log the successful call plus any failed attempts before it. */
export async function logGeneration(
  supabase: SupabaseClient,
  endpoint: string,
  r: { model: string; latencyMs: number; failures?: { model: string; status: number; latencyMs: number; error: string }[] }
) {
  for (const f of r.failures ?? []) {
    await logApiCall(supabase, { provider: f.model, endpoint, status: f.status || null, latencyMs: f.latencyMs, error: f.error });
  }
  await logApiCall(supabase, { provider: r.model, endpoint, status: 200, latencyMs: r.latencyMs, error: null });
}
