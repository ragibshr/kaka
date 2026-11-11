"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Utensils,
  Wallet,
  Activity,
  PhoneCall,
  GraduationCap,
  HandCoins,
  Clock,
  LogIn,
  LogOut,
  TrendingUp,
  TrendingDown,
  Moon,
  Droplets,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format, subDays, addDays, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { loadEntries, bn, money, MEAL_BN, type EntryRow } from "@/lib/data";

// Everything shown on the dashboard for one day (all values pre-formatted in Bengali)
interface DayData {
  entryCount: number;
  work: { hoursWorked: string; punchIn: string; punchOut: string; entries: number; notes: string };
  food: { mealCount: number; totalSpend: string; meals: { time: string; name: string; cost?: string }[] };
  finance: { spent: string; earned: string; topCategory: string };
  health: { sleep: string; drinks: string; exercise: string; mood: string };
  social: { callsCount: number; visitsCount: number; contacts: string[] };
  career: { count: number; latest: string };
  debts: { toReceive: string; toPay: string; net: string; people: number };
  totalSpent: string;
}

const DASH = "—";

function sumMoney(items: { amount: number; currency: string }[]): string {
  const totals: Record<string, number> = {};
  for (const i of items) if (Number.isFinite(i.amount)) totals[i.currency] = (totals[i.currency] ?? 0) + i.amount;
  const parts = Object.entries(totals).map(([c, v]) => money(v, c));
  return parts.length ? parts.join(" + ") : money(0, "AED");
}

function hoursBetween(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const [h1, m1] = a.split(":").map(Number);
  const [h2, m2] = b.split(":").map(Number);
  let mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

function computeDay(entries: EntryRow[], openDebts: { direction: string; amount: number; currency: string; counterparty: string }[]): DayData {
  const by = (c: string) => entries.filter((e) => e.category === c).map((e) => (e.detail ?? {}) as Record<string, any>);
  const work = by("work");
  const food = by("food");
  const fin = by("finance");
  const health = by("health");
  const social = by("social");
  const career = by("career");

  const punchIn = work.map((w) => w.punch_in).filter(Boolean).sort()[0] as string | undefined;
  const punchOut = work.map((w) => w.punch_out).filter(Boolean).sort().reverse()[0] as string | undefined;
  const loggedHours = work.reduce((s, w) => s + (Number(w.hours) || 0), 0);
  const hours = loggedHours || hoursBetween(punchIn, punchOut);

  const foodSpend = food.filter((f) => f.cost != null).map((f) => ({ amount: Number(f.cost), currency: f.currency }));
  const expenses = fin.filter((f) => f.type === "expense").map((f) => ({ amount: Number(f.amount), currency: f.currency }));
  const income = fin.filter((f) => f.type === "income").map((f) => ({ amount: Number(f.amount), currency: f.currency }));
  const tags: Record<string, number> = {};
  for (const f of fin.filter((f) => f.type === "expense")) {
    const k = f.tag || f.note;
    if (k) tags[k] = (tags[k] ?? 0) + Number(f.amount);
  }
  const topCategory = Object.entries(tags).sort((a, b) => b[1] - a[1])[0]?.[0];

  const last = (rows: Record<string, any>[], kind: string) => rows.filter((h) => h.kind === kind)[0];
  const sleep = last(health, "sleep");
  const exercise = health.filter((h) => h.kind === "exercise");
  const mood = last(health, "mood");
  const drinks = health.filter((h) => h.kind === "drink");

  const toReceive = openDebts.filter((d) => d.direction === "lent");
  const toPay = openDebts.filter((d) => d.direction === "borrowed");
  const netByCur: Record<string, number> = {};
  for (const d of openDebts) netByCur[d.currency] = (netByCur[d.currency] ?? 0) + (d.direction === "lent" ? d.amount : -d.amount);

  return {
    entryCount: entries.length,
    work: {
      hoursWorked: hours ? `${bn(Math.round(hours * 10) / 10)} ঘণ্টা` : DASH,
      punchIn: punchIn ? bn(punchIn.slice(0, 5)) : DASH,
      punchOut: punchOut ? bn(punchOut.slice(0, 5)) : punchIn ? "কর্মরত" : DASH,
      entries: work.length,
      notes: work.map((w) => w.notes).filter(Boolean)[0] ?? DASH,
    },
    food: {
      mealCount: food.length,
      totalSpend: foodSpend.length ? sumMoney(foodSpend) : DASH,
      meals: food.map((f) => ({
        time: MEAL_BN[f.meal_type] ?? "খাবার",
        name: f.description,
        cost: f.cost != null ? money(f.cost, f.currency) : undefined,
      })),
    },
    finance: {
      spent: expenses.length ? sumMoney(expenses) : DASH,
      earned: income.length ? sumMoney(income) : DASH,
      topCategory: topCategory ?? DASH,
    },
    health: {
      sleep: sleep ? String(sleep.value) : DASH,
      drinks: drinks.length ? drinks.map((d) => d.value).join(", ") : DASH,
      exercise: exercise.length ? exercise.map((e) => e.value).join(", ") : DASH,
      mood: mood ? String(mood.value) : DASH,
    },
    social: {
      callsCount: social.filter((s) => s.channel === "call").length,
      visitsCount: social.filter((s) => s.channel === "visit").length,
      contacts: [...new Set(social.map((s) => s.person as string))],
    },
    career: { count: career.length, latest: career[0]?.title ?? DASH },
    debts: {
      toReceive: toReceive.length ? sumMoney(toReceive) : DASH,
      toPay: toPay.length ? sumMoney(toPay) : DASH,
      net: Object.keys(netByCur).length ? Object.entries(netByCur).map(([c, v]) => (v >= 0 ? "+" : "-") + money(Math.abs(v), c)).join(", ") : DASH,
      people: new Set(openDebts.map((d) => d.counterparty)).size,
    },
    totalSpent: foodSpend.length + expenses.length ? sumMoney([...foodSpend, ...expenses]) : money(0, "AED"),
  };
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [day, setDay] = useState<DayData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = addDays(start, 1);
    const supabase = createClient();
    Promise.all([
      loadEntries(supabase, { from: start.toISOString(), to: end.toISOString() }),
      supabase
        .from("debts")
        .select("direction, amount, currency, counterparty")
        .is("deleted_at", null)
        .eq("status", "open"),
    ]).then(([entries, debts]) => {
      if (cancelled) return;
      setDay(
        computeDay(
          entries,
          (debts.data ?? []).map((d) => ({ ...d, amount: Number(d.amount) }))
        )
      );
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const d = day ?? computeDay([], []);

  // Date navigation handlers
  const handlePreviousDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate((prev) => addDays(prev, 1));
  const handleSelectToday = () => setSelectedDate(new Date());

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "আজ";
    if (isYesterday(date)) return "গতকাল";
    return format(date, "EEEE");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Sticky Top Header */}
      <header className="px-4 md:px-8 py-4 border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">ড্যাশবোর্ড</h1>
          <p className="text-xs md:text-sm text-muted">
            তোমার দৈনন্দিন কার্যক্রম ও সামগ্রিক সারসংক্ষেপ
          </p>
        </div>

        {/* Date Switcher */}
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border self-start sm:self-auto">
          <button
            onClick={handlePreviousDay}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white transition-theme"
            title="আগের দিন"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleSelectToday}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-lg transition-theme",
              isToday(selectedDate)
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white"
            )}
          >
            আজ
          </button>

          <button
            onClick={() => setSelectedDate(subDays(new Date(), 1))}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-lg transition-theme",
              isYesterday(selectedDate)
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white"
            )}
          >
            গতকাল
          </button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Date Picker Display */}
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-foreground bg-white rounded-lg border border-border/60">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>
              {getDateLabel(selectedDate)}, {format(selectedDate, "dd MMM yyyy")}
            </span>
            <input
              type="date"
              aria-label="তারিখ নির্বাচন করো"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(new Date(e.target.value));
                }
              }}
              className="opacity-0 absolute w-6 h-6 cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white transition-theme"
            title="পরের দিন"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {/* pb-20 on mobile to avoid overlapping the bottom navigation bar */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-6 space-y-6">
        {/* Top Highlight Banner */}
        <div className="bg-gradient-to-r from-accent-light via-blue-50 to-surface border border-accent/20 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-foreground">
                {getDateLabel(selectedDate)} দিনের পর্যালোচনা
              </h2>
              <p className="text-xs text-muted">
                {day === null
                  ? "লোড হচ্ছে..."
                  : d.entryCount
                    ? `এই দিনে ${bn(d.entryCount)}টি এন্ট্রি আছে।`
                    : "এই দিনে কিছু লেখা নেই — চ্যাটে কাকাকে বলো।"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1.5 bg-white rounded-lg border border-border text-foreground font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              কাজ: {d.work.hoursWorked}
            </span>
            <span className="px-3 py-1.5 bg-white rounded-lg border border-border text-foreground font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              মোট খরচ: {d.totalSpent}
            </span>
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {/* Card 1: Work */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  কাজের হিসাব
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-accent flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {d.work.hoursWorked}
                </p>
                <p className="text-xs text-muted flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  {bn(d.work.entries)}টি কাজের এন্ট্রি
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <LogIn className="w-3.5 h-3.5 text-success" /> ইন
                </span>
                <span className="font-medium text-foreground">
                  {d.work.punchIn}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <LogOut className="w-3.5 h-3.5 text-warning" /> আউট
                </span>
                <span className="font-medium text-foreground">
                  {d.work.punchOut || "কর্মরত"}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> নোট
                </span>
                <span className="font-medium text-foreground">
                  {d.work.notes}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Food */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  খাবার ও পুষ্টি
                </span>
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold text-foreground">
                    {bn(d.food.mealCount)} বেলা
                  </p>
                  <span className="text-sm font-semibold text-foreground">
                    {d.food.totalSpend}
                  </span>
                </div>
                <p className="text-xs text-muted">খাবারে মোট খরচ</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-1.5 text-xs">
              {d.food.meals.length === 0 && <span className="text-muted">{DASH}</span>}
              {d.food.meals.map((meal, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-muted">
                    {meal.time}: <strong className="font-medium text-foreground">{meal.name}</strong>
                  </span>
                  <span className="text-muted font-medium">{meal.cost}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Finance */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  আর্থিক লেনদেন
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-success flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {d.finance.spent}
                </p>
                <p className="text-xs text-muted flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-danger" />
                  খরচ (খাবার বাদে)
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-success" /> আয়
                </span>
                <span className="font-medium text-foreground">
                  {d.finance.earned}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>শীর্ষ খাত</span>
                <span className="font-medium text-foreground">
                  {d.finance.topCategory}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Health */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  স্বাস্থ্য ও যত্ন
                </span>
                <div className="w-8 h-8 rounded-lg bg-red-50 text-danger flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {d.health.sleep}
                </p>
                <p className="text-xs text-muted flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-accent" />
                  ঘুম
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> পানীয়
                </span>
                <span className="font-medium text-foreground">
                  {d.health.drinks}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-600" /> শরীরচর্চা
                </span>
                <span className="font-medium text-foreground">
                  {d.health.exercise}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>মেজাজ</span>
                <span className="font-medium text-foreground">
                  {d.health.mood}
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: Social */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  সামাজিক যোগাযোগ
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {bn(d.social.callsCount)}টি কল
                </p>
                <p className="text-xs text-muted flex items-center gap-1">
                  {bn(d.social.visitsCount)}টি দেখা-সাক্ষাৎ
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-1 text-xs">
              <span className="text-muted block mb-1">যাদের সাথে কথা হলো:</span>
              <div className="flex flex-wrap gap-1.5">
                {d.social.contacts.length === 0 && <span className="text-muted">{DASH}</span>}
                {d.social.contacts.map((contact, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-surface text-foreground font-medium rounded-md border border-border"
                  >
                    {contact}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 6: Career */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  ক্যারিয়ার ও লক্ষ্য
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {bn(d.career.count)}টি আপডেট
                </p>
                <p className="text-xs text-muted">আবেদন, ইন্টারভিউ, নতুন দক্ষতা</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-1.5 text-xs">
              <span className="text-muted block">সর্বশেষ:</span>
              <p className="font-medium text-foreground bg-surface p-2 rounded-lg border border-border">
                {d.career.latest}
              </p>
            </div>
          </div>

          {/* Card 7: Open Debts */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  বকেয়া ধারদেনা
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-warning flex items-center justify-center">
                  <HandCoins className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {d.debts.net}
                </p>
                <p className="text-xs text-muted">নিট পাওনা হিসাব</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>পাবো (Lent)</span>
                <span className="font-semibold text-success">
                  {d.debts.toReceive}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>দেবো (Owe)</span>
                <span className="font-semibold text-danger">
                  {d.debts.toPay}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>বকেয়া ব্যক্তি</span>
                <span className="font-medium text-foreground">
                  {bn(d.debts.people)} জন
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
