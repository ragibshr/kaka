"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart2, Sparkles, Wallet, Utensils, Briefcase, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { subDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { loadEntries, bn, money, type EntryRow } from "@/lib/data";

type TimeRange = "weekly" | "monthly";

function spendOf(e: EntryRow): { amount: number; currency: string } | null {
  const d = (e.detail ?? {}) as Record<string, any>;
  if (e.category === "food" && d.cost != null) return { amount: Number(d.cost), currency: d.currency };
  if (e.category === "finance" && d.type === "expense") return { amount: Number(d.amount), currency: d.currency };
  return null;
}

export default function InsightsPage() {
  const [range, setRange] = useState<TimeRange>("weekly");
  const [entries, setEntries] = useState<EntryRow[] | null>(null);
  const days = range === "weekly" ? 7 : 30;

  useEffect(() => {
    setEntries(null);
    const start = subDays(new Date(), days - 1);
    start.setHours(0, 0, 0, 0);
    loadEntries(createClient(), { from: start.toISOString(), limit: 2000 })
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [days]);

  const stats = useMemo(() => {
    const list = entries ?? [];
    // Main currency = the one used most for spending
    const curCount: Record<string, number> = {};
    for (const e of list) {
      const s = spendOf(e);
      if (s) curCount[s.currency] = (curCount[s.currency] ?? 0) + 1;
    }
    const cur = Object.entries(curCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "AED";

    const byDay: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) byDay[format(subDays(new Date(), i), "yyyy-MM-dd")] = 0;
    let spend = 0;
    let foodSpend = 0;
    for (const e of list) {
      const s = spendOf(e);
      if (!s || s.currency !== cur) continue;
      spend += s.amount;
      if (e.category === "food") foodSpend += s.amount;
      const k = format(new Date(e.occurred_at), "yyyy-MM-dd");
      if (k in byDay) byDay[k] += s.amount;
    }
    const workHours = list
      .filter((e) => e.category === "work")
      .reduce((s, e) => s + (Number((e.detail as any)?.hours) || 0), 0);
    const people = new Set(list.filter((e) => e.category === "social").map((e) => (e.detail as any)?.person));
    const chart = Object.entries(byDay).map(([d, v]) => ({
      day: range === "weekly" ? new Date(d).toLocaleDateString("bn-BD", { weekday: "short" }) : bn(d.slice(8)),
      amount: Math.round(v * 100) / 100,
    }));
    return { cur, spend, foodSpend, workHours, people: people.size, count: list.length, chart };
  }, [entries, days, range]);

  const cards = [
    { icon: Wallet, label: "মোট খরচ", value: money(stats.spend, stats.cur), color: "text-emerald-600 bg-emerald-50" },
    { icon: Utensils, label: "খাবারে", value: money(stats.foodSpend, stats.cur), color: "text-orange-600 bg-orange-50" },
    { icon: Briefcase, label: "কাজের ঘণ্টা (লেখা)", value: stats.workHours ? `${bn(stats.workHours)} ঘণ্টা` : "—", color: "text-blue-600 bg-blue-50" },
    { icon: Users, label: "যোগাযোগ", value: `${bn(stats.people)} জন`, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-20 md:pb-6">
      <header className="px-4 md:px-8 py-4 border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">বিশ্লেষণ</h1>
          <p className="text-xs md:text-sm text-muted">তোমার লেখা তথ্য থেকে হিসাব</p>
        </div>
        <div className="flex p-1 bg-surface rounded-xl border border-border self-start">
          {(["weekly", "monthly"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-4 py-1.5 text-xs font-semibold rounded-lg",
                range === r ? "bg-white text-accent shadow-sm" : "text-muted hover:text-foreground"
              )}
            >
              {r === "weekly" ? "গত ৭ দিন" : "গত ৩০ দিন"}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        {entries === null ? (
          <p className="text-center text-sm text-muted py-12">লোড হচ্ছে...</p>
        ) : stats.count === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center space-y-2 max-w-md mx-auto my-8">
            <BarChart2 className="w-8 h-8 text-muted mx-auto" />
            <h3 className="text-base font-semibold text-foreground">এখনো বিশ্লেষণের মতো তথ্য নেই</h3>
            <p className="text-xs text-muted">
              কয়েকদিন{" "}
              <Link href="/" className="text-accent font-medium">
                চ্যাটে
              </Link>{" "}
              খরচ, খাবার, কাজের কথা লেখো — এখানে হিসাব আর চার্ট দেখা যাবে।
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {cards.map((c) => (
                <div key={c.label} className="bg-white border border-border rounded-xl p-4 shadow-sm">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", c.color)}>
                    <c.icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-muted">{c.label}</p>
                  <p className="text-lg font-bold text-foreground">{c.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-border rounded-xl p-4 md:p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground mb-4">দৈনিক খরচ ({stats.cur})</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chart}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={range === "weekly" ? 0 : 3} />
                    <YAxis tick={{ fontSize: 11 }} width={40} />
                    <Tooltip formatter={(v) => [`${v} ${stats.cur}`, "খরচ"]} />
                    <Bar dataKey="amount" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <p className="text-xs text-muted text-center">মোট {bn(stats.count)}টি এন্ট্রি থেকে হিসাব করা</p>
          </>
        )}

        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />
          <p className="text-xs md:text-sm text-muted">
            কাকার লেখা সাপ্তাহিক রিভিউ (কী ভালো গেল, কোথায় খেয়াল রাখতে হবে) পরের ধাপে আসছে।
          </p>
        </div>
      </div>
    </div>
  );
}
