import type { SupabaseClient } from "@supabase/supabase-js";
import { dayBounds, localDate } from "@/lib/time";

function sumBy(rows: { amount: number | null; currency: string }[]) {
  const totals: Record<string, number> = {};
  for (const r of rows) {
    if (r.amount == null) continue;
    totals[r.currency] = (totals[r.currency] ?? 0) + Number(r.amount);
  }
  return Object.entries(totals)
    .map(([c, v]) => `${Math.round(v * 100) / 100} ${c}`)
    .join(", ");
}

/** Plain-text facts about today, given to the chat model so it can answer "how much did I spend". */
export async function buildTodaySummary(supabase: SupabaseClient, timeZone: string): Promise<string> {
  const { start, end } = dayBounds(timeZone);
  const today = localDate(timeZone);

  const [fin, food, work, health, debts] = await Promise.all([
    supabase.from("finance_logs").select("type, amount, currency, note, counterparty")
      .is("deleted_at", null).gte("occurred_at", start).lt("occurred_at", end),
    supabase.from("food_logs").select("meal_type, description, cost, currency")
      .is("deleted_at", null).gte("occurred_at", start).lt("occurred_at", end),
    supabase.from("work_logs").select("punch_in, punch_out, hours")
      .is("deleted_at", null).eq("work_date", today),
    supabase.from("health_logs").select("kind, value")
      .is("deleted_at", null).gte("occurred_at", start).lt("occurred_at", end),
    supabase.from("debts").select("counterparty, direction, amount, currency")
      .is("deleted_at", null).eq("status", "open"),
  ]);

  const lines: string[] = [`Date: ${today}`];
  const finRows = fin.data ?? [];
  const expenses = finRows.filter((r) => r.type === "expense");
  const income = finRows.filter((r) => r.type === "income");
  const foodSpend = (food.data ?? [])
    .filter((f) => f.cost != null)
    .map((f) => ({ amount: Number(f.cost), currency: f.currency }));
  const allSpend = [...expenses.map((e) => ({ amount: Number(e.amount), currency: e.currency })), ...foodSpend];
  lines.push(`Total spent today (expenses + food): ${allSpend.length ? sumBy(allSpend) : "nothing"}`);
  if (expenses.length) {
    lines.push(
      "Non-food expense items: " +
        expenses.map((e) => `${e.amount} ${e.currency}${e.note ? ` (${e.note})` : ""}`).join("; ")
    );
  }
  if (income.length) lines.push(`Income today: ${sumBy(income)}`);
  if (food.data?.length) {
    lines.push(
      "Meals: " +
        food.data.map((f) => `${f.meal_type}: ${f.description}${f.cost != null ? ` (${f.cost} ${f.currency})` : ""}`).join("; ")
    );
  }
  if (work.data?.length) {
    lines.push(
      "Work: " +
        work.data
          .map((w) => [w.punch_in && `in ${w.punch_in}`, w.punch_out && `out ${w.punch_out}`, w.hours && `${w.hours}h`].filter(Boolean).join(" "))
          .join("; ")
    );
  }
  if (health.data?.length) lines.push("Health: " + health.data.map((h) => `${h.kind}: ${h.value}`).join("; "));
  const open = debts.data ?? [];
  if (open.length) {
    lines.push(
      "Open debts: " +
        open.map((d) => `${d.counterparty} ${d.direction === "lent" ? "owes me" : "I owe"} ${d.amount} ${d.currency}`).join("; ")
    );
  }
  return lines.join("\n");
}
