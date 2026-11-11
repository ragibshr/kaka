import type { SupabaseClient } from "@supabase/supabase-js";

export type Category = "work" | "food" | "finance" | "debt" | "health" | "social" | "career" | "note";

export interface EntryRow {
  id: string;
  category: Category;
  raw_text: string;
  occurred_at: string;
  detail_table: string | null;
  detail_id: string | null;
  data: Record<string, unknown>;
  // the matching row from work_logs / food_logs / ... (null for notes)
  detail: Record<string, unknown> | null;
}

const DETAIL_TABLES = [
  "work_logs",
  "food_logs",
  "finance_logs",
  "debts",
  "health_logs",
  "social_logs",
  "career_logs",
] as const;

/** Load entries (newest first) plus their detail rows. */
export async function loadEntries(
  supabase: SupabaseClient,
  opts: { from?: string; to?: string; limit?: number } = {}
): Promise<EntryRow[]> {
  let q = supabase
    .from("entries")
    .select("id, category, raw_text, occurred_at, detail_table, detail_id, data")
    .is("deleted_at", null)
    .neq("status", "discarded")
    .order("occurred_at", { ascending: false })
    .limit(opts.limit ?? 500);
  if (opts.from) q = q.gte("occurred_at", opts.from);
  if (opts.to) q = q.lt("occurred_at", opts.to);
  const { data: entries, error } = await q;
  if (error) throw error;
  const rows = (entries ?? []) as Omit<EntryRow, "detail">[];

  const byTable: Record<string, string[]> = {};
  for (const e of rows) {
    if (e.detail_table && e.detail_id) (byTable[e.detail_table] ??= []).push(e.detail_id);
  }
  const details: Record<string, Record<string, unknown>> = {};
  await Promise.all(
    Object.entries(byTable)
      .filter(([t]) => (DETAIL_TABLES as readonly string[]).includes(t))
      .map(async ([table, ids]) => {
        const { data } = await supabase.from(table).select("*").in("id", ids).is("deleted_at", null);
        for (const d of data ?? []) details[d.id as string] = d;
      })
  );

  return rows
    .map((e) => ({ ...e, detail: e.detail_id ? details[e.detail_id] ?? null : null }))
    // hide entries whose detail row was deleted
    .filter((e) => !e.detail_table || e.detail);
}

// ── Formatting helpers (Bengali UI) ──────────────────────────
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export function bn(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "";
  const v = typeof n === "number" ? (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "")) : String(n);
  return v.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function money(amount: unknown, currency: unknown): string {
  const a = Number(amount);
  if (!Number.isFinite(a)) return "";
  const cur = String(currency || "AED");
  const label = cur === "AED" ? "দিরহাম" : cur === "BDT" ? "টাকা" : cur === "USD" ? "ডলার" : cur;
  return `${bn(a)} ${label}`;
}

export function timeBn(iso: string, timeZone?: string): string {
  try {
    return new Date(iso).toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit", timeZone });
  } catch {
    return "";
  }
}

export function dateBn(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "আজ";
  if (same(d, y)) return "গতকাল";
  return d.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
}

export const MEAL_BN: Record<string, string> = {
  breakfast: "সকালের নাস্তা",
  lunch: "দুপুরের খাবার",
  dinner: "রাতের খাবার",
  snack: "নাস্তা",
  other: "খাবার",
};

export const HEALTH_BN: Record<string, string> = {
  sleep: "ঘুম",
  drink: "পানীয়",
  exercise: "ব্যায়াম",
  mood: "মেজাজ",
  symptom: "উপসর্গ",
  other: "স্বাস্থ্য",
};

export const CHANNEL_BN: Record<string, string> = {
  call: "কল",
  visit: "দেখা",
  message: "মেসেজ",
  other: "যোগাযোগ",
};

export const FIN_BN: Record<string, string> = { expense: "খরচ", income: "আয়", transfer: "ট্রান্সফার" };
