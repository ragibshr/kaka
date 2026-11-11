import type { SupabaseClient } from "@supabase/supabase-js";

export const CATEGORY_BN: Record<string, string> = {
  work: "কাজ",
  food: "খাবার",
  finance: "টাকা",
  debt: "ধার",
  health: "স্বাস্থ্য",
  social: "যোগাযোগ",
  career: "ক্যারিয়ার",
  note: "নোট",
};

/** Soft-delete an entry and its detail row (works from the browser thanks to RLS). */
export async function discardEntry(supabase: SupabaseClient, entryId: string) {
  const now = new Date().toISOString();
  const { data: entry, error } = await supabase
    .from("entries")
    .update({ status: "discarded", deleted_at: now })
    .eq("id", entryId)
    .select("detail_table, detail_id")
    .single();
  if (error) throw error;
  if (entry?.detail_table && entry.detail_id) {
    const { error: dErr } = await supabase
      .from(entry.detail_table)
      .update({ deleted_at: now })
      .eq("id", entry.detail_id);
    if (dErr) throw dErr;
  }
}
