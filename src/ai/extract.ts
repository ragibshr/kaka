import "server-only";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generate, parseJson } from "./gemini";
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserContent } from "./prompts";
import type { SavedItem } from "./types";
import { localDate } from "@/lib/time";

const num = z.preprocess((v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string") {
    const bn = "০১২৩৪৫৬৭৮৯";
    const ascii = v.replace(/[০-৯]/g, (d) => String(bn.indexOf(d))).replace(/[^\d.\-]/g, "");
    return ascii === "" ? null : Number(ascii);
  }
  return v;
}, z.number().finite().nullable());

const str = z.preprocess((v) => (v === undefined || v === "" ? null : v == null ? null : String(v)), z.string().nullable());
const time = z.preprocess((v) => {
  if (typeof v !== "string") return null;
  const m = v.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null;
}, z.string().nullable());
const currency = z.preprocess((v) => (typeof v === "string" && v.trim() ? v.trim().toUpperCase() : "AED"), z.string());
const oneOf = <T extends [string, ...string[]]>(vals: T, fallback: T[number]) =>
  z.preprocess((v) => (typeof v === "string" && (vals as string[]).includes(v.toLowerCase()) ? v.toLowerCase() : fallback), z.enum(vals));

const Item = z.object({
  category: z.enum(["work", "food", "finance", "debt", "health", "social", "career", "note"]),
  occurred_at: z.string().nullish(),
  confidence: z.number().min(0).max(1).catch(0.8),
  fields: z.record(z.string(), z.unknown()).catch({}),
  clarify: z.string().nullish(),
});
const Extraction = z.object({ items: z.array(z.unknown()).catch([]) });

export type ExtractedItem = z.infer<typeof Item>;

export async function extractItems(message: string, timeZone: string) {
  const result = await generate({
    system: EXTRACTION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildExtractionUserContent(message, timeZone) }],
    json: true,
  });
  let items: ExtractedItem[] = [];
  try {
    const parsed = Extraction.parse(parseJson(result.text));
    items = parsed.items.flatMap((raw) => {
      const r = Item.safeParse(raw);
      return r.success ? [r.data] : [];
    });
  } catch {
    items = [];
  }
  return { items, model: result.model, latencyMs: result.latencyMs };
}

const CATEGORY_BN: Record<string, string> = {
  work: "কাজ",
  food: "খাবার",
  finance: "টাকা",
  debt: "ধার",
  health: "স্বাস্থ্য",
  social: "যোগাযোগ",
  career: "ক্যারিয়ার",
  note: "নোট",
};

function validIso(v: string | null | undefined): string {
  if (v && !Number.isNaN(Date.parse(v))) return new Date(v).toISOString();
  return new Date().toISOString();
}

/** Build the detail-table row + a short Bengali label for the chip. */
function detailFor(item: ExtractedItem, occurredAt: string, timeZone: string) {
  const f = item.fields;
  switch (item.category) {
    case "work": {
      const hours = num.parse(f.hours);
      return {
        table: "work_logs",
        row: {
          work_date: localDate(timeZone, new Date(occurredAt)),
          punch_in: time.parse(f.punch_in),
          punch_out: time.parse(f.punch_out),
          hours,
          notes: str.parse(f.notes),
        },
        label: hours ? `কাজ ${hours} ঘণ্টা` : "কাজ",
      };
    }
    case "food": {
      const cost = num.parse(f.cost);
      const cur = currency.parse(f.currency);
      return {
        table: "food_logs",
        row: {
          occurred_at: occurredAt,
          meal_type: oneOf(["breakfast", "lunch", "dinner", "snack", "other"], "other").parse(f.meal_type),
          description: str.parse(f.description) ?? "খাবার",
          cost,
          currency: cur,
        },
        label: `খাবার${cost ? ` ${cost} ${cur}` : ""}`,
      };
    }
    case "finance": {
      const amount = num.parse(f.amount);
      if (amount === null) return null;
      const type = oneOf(["expense", "income", "transfer"], "expense").parse(f.type);
      const cur = currency.parse(f.currency);
      return {
        table: "finance_logs",
        row: {
          occurred_at: occurredAt,
          type,
          amount,
          currency: cur,
          counterparty: str.parse(f.counterparty),
          note: str.parse(f.note),
          tag: str.parse(f.tag),
        },
        label: `${type === "income" ? "আয়" : type === "transfer" ? "ট্রান্সফার" : "খরচ"} ${amount} ${cur}`,
      };
    }
    case "debt": {
      const amount = num.parse(f.amount);
      const who = str.parse(f.counterparty);
      if (amount === null || !who) return null;
      const direction = oneOf(["lent", "borrowed"], "lent").parse(f.direction);
      const cur = currency.parse(f.currency);
      const due = str.parse(f.due_date);
      return {
        table: "debts",
        row: {
          occurred_at: occurredAt,
          counterparty: who,
          direction,
          amount,
          currency: cur,
          due_date: due && /^\d{4}-\d{2}-\d{2}/.test(due) ? due.slice(0, 10) : null,
          note: str.parse(f.note),
        },
        label: `${who} ${direction === "lent" ? "কে দিলাম" : "থেকে নিলাম"} ${amount} ${cur}`,
      };
    }
    case "health": {
      const kind = oneOf(["sleep", "drink", "exercise", "mood", "symptom", "other"], "other").parse(f.kind);
      return {
        table: "health_logs",
        row: {
          occurred_at: occurredAt,
          kind,
          value: str.parse(f.value) ?? kind,
          numeric_value: num.parse(f.numeric_value),
          notes: str.parse(f.notes),
        },
        label: "স্বাস্থ্য",
      };
    }
    case "social": {
      const person = str.parse(f.person);
      if (!person) return null;
      return {
        table: "social_logs",
        row: {
          occurred_at: occurredAt,
          person,
          channel: oneOf(["call", "visit", "message", "other"], "other").parse(f.channel),
          duration_min: num.parse(f.duration_min),
          notes: str.parse(f.notes),
        },
        label: `যোগাযোগ: ${person}`,
      };
    }
    case "career": {
      const title = str.parse(f.title);
      if (!title) return null;
      return {
        table: "career_logs",
        row: {
          occurred_at: occurredAt,
          kind: oneOf(["application", "lead", "interview", "skill", "other"], "other").parse(f.kind),
          title,
          org: str.parse(f.org),
          status: str.parse(f.status),
          notes: str.parse(f.notes),
        },
        label: `ক্যারিয়ার: ${title}`,
      };
    }
    case "note":
      return { table: null, row: null, label: "নোট" };
  }
}

/**
 * Save extracted items: one `entries` row each, plus a row in its detail table.
 * Items the AI was unsure about (or that miss required values) are skipped and
 * their clarify question returned instead.
 */
export async function saveItems(
  supabase: SupabaseClient,
  items: ExtractedItem[],
  ctx: { rawText: string; sourceMessageId: string | null; timeZone: string }
): Promise<{ saved: SavedItem[]; clarify: string[] }> {
  const saved: SavedItem[] = [];
  const clarify: string[] = [];

  for (const item of items) {
    if (item.clarify) clarify.push(item.clarify);
    const occurredAt = validIso(item.occurred_at);
    const detail = detailFor(item, occurredAt, ctx.timeZone);
    if (!detail || item.confidence < 0.4) continue;

    const { data: entry, error } = await supabase
      .from("entries")
      .insert({
        category: item.category,
        raw_text: ctx.rawText,
        occurred_at: occurredAt,
        source_message_id: ctx.sourceMessageId,
        confidence: item.confidence,
        data: item.fields,
      })
      .select("id")
      .single();
    if (error || !entry) continue;

    if (detail.table && detail.row) {
      const { data: d, error: dErr } = await supabase
        .from(detail.table)
        .insert({ ...detail.row, entry_id: entry.id })
        .select("id")
        .single();
      if (dErr || !d) {
        await supabase.from("entries").delete().eq("id", entry.id);
        continue;
      }
      await supabase.from("entries").update({ detail_table: detail.table, detail_id: d.id }).eq("id", entry.id);
    }

    saved.push({ entryId: entry.id, category: CATEGORY_BN[item.category] ?? item.category, label: detail.label });
  }

  return { saved, clarify };
}
