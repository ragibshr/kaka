"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Types for debts and loans
export type DebtDirection = "lent" | "borrowed"; // lent = owed to me (পাবো), borrowed = I owe (দেবো)
export type DebtStatus = "pending" | "partial" | "settled";

export interface DebtItem {
  id: string;
  amount: number;
  currency: string;
  direction: DebtDirection;
  status: DebtStatus;
  date: string;
  dueDate?: string;
  description: string;
  paidAmount?: number;
}

export interface PersonDebts {
  personId: string;
  personName: string;
  phone?: string;
  avatarBg?: string;
  items: DebtItem[];
}

const AVATAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500"];

/** Load open + settled debts with their partial payments, grouped by person. */
async function loadDebts(): Promise<PersonDebts[]> {
  const supabase = createClient();
  const [{ data: debts }, { data: settlements }] = await Promise.all([
    supabase
      .from("debts")
      .select("id, counterparty, direction, amount, currency, due_date, status, note, occurred_at")
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false }),
    supabase.from("debt_settlements").select("debt_id, amount").is("deleted_at", null),
  ]);
  const paid: Record<string, number> = {};
  for (const s of settlements ?? []) paid[s.debt_id] = (paid[s.debt_id] ?? 0) + Number(s.amount);

  const people = new Map<string, PersonDebts>();
  for (const d of debts ?? []) {
    const key = String(d.counterparty).trim();
    if (!people.has(key)) {
      people.set(key, {
        personId: key,
        personName: key,
        avatarBg: AVATAR_COLORS[people.size % AVATAR_COLORS.length],
        items: [],
      });
    }
    const paidAmount = paid[d.id] ?? 0;
    people.get(key)!.items.push({
      id: d.id,
      amount: Number(d.amount),
      currency: d.currency,
      direction: d.direction,
      status: d.status === "settled" ? "settled" : paidAmount > 0 ? "partial" : "pending",
      date: new Date(d.occurred_at).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" }),
      dueDate: d.due_date ? new Date(d.due_date).toLocaleDateString("bn-BD", { day: "numeric", month: "long" }) : undefined,
      description: d.note || (d.direction === "lent" ? "ধার দিয়েছি" : "ধার নিয়েছি"),
      paidAmount: paidAmount || undefined,
    });
  }
  return [...people.values()];
}

export default function DebtsPage() {
  const [peopleDebts, setPeopleDebts] = useState<PersonDebts[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDirection, setFilterDirection] = useState<"all" | "lent" | "borrowed" | "settled">("all");
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);

  const reload = () =>
    loadDebts()
      .then((p) => {
        setPeopleDebts(p);
        setExpandedPersonId((cur) => cur ?? p[0]?.personId ?? null);
      })
      .catch(() => setPeopleDebts([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    void reload();
  }, []);

  // Most debts share one currency; show totals in the most common one
  const cur = useMemo(() => {
    const count: Record<string, number> = {};
    peopleDebts.forEach((p) => p.items.forEach((i) => (count[i.currency] = (count[i.currency] ?? 0) + 1)));
    return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "AED";
  }, [peopleDebts]);

  // Summary calculations
  const summary = useMemo(() => {
    let totalOwedToMe = 0;
    let totalIOwe = 0;

    peopleDebts.forEach((person) => {
      person.items.forEach((item) => {
        if (item.status === "settled") return;

        const remaining = item.amount - (item.paidAmount || 0);
        if (item.direction === "lent") {
          totalOwedToMe += remaining;
        } else {
          totalIOwe += remaining;
        }
      });
    });

    const net = totalOwedToMe - totalIOwe;

    return {
      totalOwedToMe,
      totalIOwe,
      net,
    };
  }, [peopleDebts]);

  // Mark a debt fully settled
  const handleMarkSettled = async (_personId: string, itemId: string) => {
    const { error } = await createClient().from("debts").update({ status: "settled" }).eq("id", itemId);
    if (error) return alert("আপডেট করা গেল না, আবার চেষ্টা করো।");
    void reload();
  };

  // Record a partial payment
  const handlePartialPayment = async (personId: string, itemId: string) => {
    const item = peopleDebts.find((p) => p.personId === personId)?.items.find((i) => i.id === itemId);
    if (!item) return;
    const payInput = prompt(`কত পরিশোধ হলো? (${item.currency})`, "");
    if (!payInput) return;
    const paidValue = parseFloat(payInput.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))));
    if (isNaN(paidValue) || paidValue <= 0) return;
    const supabase = createClient();
    const { error } = await supabase.from("debt_settlements").insert({ debt_id: itemId, amount: paidValue });
    if (error) return alert("সেভ করা গেল না, আবার চেষ্টা করো।");
    if ((item.paidAmount ?? 0) + paidValue >= item.amount) {
      await supabase.from("debts").update({ status: "settled" }).eq("id", itemId);
    }
    void reload();
  };

  // Toggle person accordion
  const togglePerson = (personId: string) => {
    setExpandedPersonId((prev) => (prev === personId ? null : personId));
  };

  // Filtered persons
  const filteredPeople = useMemo(() => {
    return peopleDebts
      .map((person) => {
        const filteredItems = person.items.filter((item) => {
          if (filterDirection === "all") return true;
          if (filterDirection === "settled") return item.status === "settled";
          if (filterDirection === "lent")
            return item.direction === "lent" && item.status !== "settled";
          if (filterDirection === "borrowed")
            return item.direction === "borrowed" && item.status !== "settled";
          return true;
        });

        return {
          ...person,
          items: filteredItems,
        };
      })
      .filter((person) => person.items.length > 0);
  }, [peopleDebts, filterDirection]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <header className="px-4 md:px-8 py-4 border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">ধারদেনা ও ঋণ</h1>
            <p className="text-xs md:text-sm text-muted">
              কার কাছে কত টাকা পাবে বা দেবে তার সুনির্দিষ্ট হিসাব
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white text-xs md:text-sm font-medium rounded-xl hover:bg-accent-hover transition-theme shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>চ্যাটে লেখো</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      {/* pb-20 on mobile to allow clearance for bottom nav bar */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-6 space-y-6">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Owed to Me */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                আমি পাবো (Lent)
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-success flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-success">
              {cur} {summary.totalOwedToMe.toLocaleString()}
            </p>
            <p className="text-xs text-muted mt-1">
              অন্যরা আমাকে পরিশোধ করবে
            </p>
          </div>

          {/* Card 2: Total I Owe */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                আমি দেবো (I Owe)
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-danger flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-danger">
              {cur} {summary.totalIOwe.toLocaleString()}
            </p>
            <p className="text-xs text-muted mt-1">
              আমাকে অন্যদের দিতে হবে
            </p>
          </div>

          {/* Card 3: Net Balance */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                নিট স্থিতি (Net)
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-accent flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <p
              className={cn(
                "text-2xl font-bold",
                summary.net >= 0 ? "text-accent" : "text-danger"
              )}
            >
              {summary.net >= 0 ? "+" : ""}{cur} {summary.net.toLocaleString()}
            </p>
            <p className="text-xs text-muted mt-1">
              {summary.net >= 0 ? "পাওনা অর্থের পাল্লা ভারী" : "দেনা বেশি রয়েছে"}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFilterDirection("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-theme shrink-0",
              filterDirection === "all"
                ? "bg-accent text-white shadow-sm"
                : "bg-surface text-muted hover:text-foreground border border-border"
            )}
          >
            সব হিসাব
          </button>
          <button
            onClick={() => setFilterDirection("lent")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-theme shrink-0 flex items-center gap-1",
              filterDirection === "lent"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-surface text-muted hover:text-foreground border border-border"
            )}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            পাবো (বকেয়া)
          </button>
          <button
            onClick={() => setFilterDirection("borrowed")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-theme shrink-0 flex items-center gap-1",
              filterDirection === "borrowed"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-surface text-muted hover:text-foreground border border-border"
            )}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            দেবো (বকেয়া)
          </button>
          <button
            onClick={() => setFilterDirection("settled")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-theme shrink-0 flex items-center gap-1",
              filterDirection === "settled"
                ? "bg-slate-700 text-white shadow-sm"
                : "bg-surface text-muted hover:text-foreground border border-border"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            পরিশোধিত
          </button>
        </div>

        {/* Person Wise Debts Grouping */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            ব্যক্তিভিত্তিক তালিকা ({filteredPeople.length} জন)
          </h2>

          {loading ? (
            <div className="text-center text-sm text-muted py-10">লোড হচ্ছে...</div>
          ) : filteredPeople.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-muted mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                কোনো হিসাব পাওয়া যায়নি
              </p>
              <p className="text-xs text-muted">
                {peopleDebts.length === 0
                  ? "চ্যাটে বলো, যেমন \"রহিমকে ২০০ দিরহাম ধার দিলাম\" — এখানে চলে আসবে।"
                  : "এই ফিল্টারে কোনো তথ্য মেলেনি।"}
              </p>
            </div>
          ) : (
            filteredPeople.map((person) => {
              const isExpanded = expandedPersonId === person.personId;

              // Calculate person's net
              let personLent = 0;
              let personBorrowed = 0;
              person.items.forEach((item) => {
                if (item.status === "settled") return;
                const rem = item.amount - (item.paidAmount || 0);
                if (item.direction === "lent") personLent += rem;
                else personBorrowed += rem;
              });
              const personNet = personLent - personBorrowed;

              return (
                <div
                  key={person.personId}
                  className="bg-white border border-border rounded-xl shadow-sm overflow-hidden transition-all"
                >
                  {/* Person Header / Accordion trigger */}
                  <div
                    onClick={() => togglePerson(person.personId)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface/50 transition-theme"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow-sm",
                          person.avatarBg || "bg-accent"
                        )}
                      >
                        {person.personName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-foreground">
                          {person.personName}
                        </h3>
                        {person.phone && (
                          <p className="text-xs text-muted">{person.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Person Net badge */}
                      <div className="text-right">
                        <span className="text-[10px] text-muted uppercase block">
                          ব্যক্তিগত স্থিতি
                        </span>
                        <span
                          className={cn(
                            "text-xs md:text-sm font-bold",
                            personNet > 0
                              ? "text-success"
                              : personNet < 0
                              ? "text-danger"
                              : "text-muted"
                          )}
                        >
                          {personNet > 0
                            ? `+${cur} ${personNet.toLocaleString()} (পাবো)`
                            : personNet < 0
                            ? `-${cur} ${Math.abs(personNet).toLocaleString()} (দেবো)`
                            : "হিসাব সমান"}
                        </span>
                      </div>

                      <div className="text-muted p-1 rounded-lg hover:bg-surface">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Debt Items */}
                  {isExpanded && (
                    <div className="border-t border-border/70 bg-surface/30 p-4 space-y-3">
                      {person.items.map((item) => {
                        const isLent = item.direction === "lent";
                        const isSettled = item.status === "settled";
                        const remaining = item.amount - (item.paidAmount || 0);

                        return (
                          <div
                            key={item.id}
                            className="bg-white border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            {/* Direction & Description */}
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-md text-xs font-semibold flex items-center gap-1",
                                    isLent
                                      ? "bg-emerald-50 text-success border border-emerald-200"
                                      : "bg-rose-50 text-danger border border-rose-200"
                                  )}
                                >
                                  {isLent ? (
                                    <>
                                      <ArrowDownLeft className="w-3 h-3" /> আমি দিয়েছি (পাবো)
                                    </>
                                  ) : (
                                    <>
                                      <ArrowUpRight className="w-3 h-3" /> আমি নিয়েছি (দেবো)
                                    </>
                                  )}
                                </span>

                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-md text-[11px] font-medium",
                                    isSettled
                                      ? "bg-slate-100 text-slate-700 border border-slate-200"
                                      : item.status === "partial"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-blue-50 text-accent border border-blue-200"
                                  )}
                                >
                                  {isSettled
                                    ? "পরিশোধিত"
                                    : item.status === "partial"
                                    ? "আংশিক পরিশোধ"
                                    : "বকেয়া"}
                                </span>
                              </div>

                              <p className="text-sm font-medium text-foreground pt-1">
                                {item.description}
                              </p>

                              <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  তারিখ: {item.date}
                                </span>
                                {item.dueDate && (
                                  <span className="flex items-center gap-1 text-warning">
                                    <Clock className="w-3 h-3" />
                                    শেষ তারিখ: {item.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Amount and Action buttons */}
                            <div className="flex flex-col md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-border/60">
                              <div className="md:text-right">
                                <span className="text-base md:text-lg font-bold text-foreground">
                                  {item.currency} {item.amount.toLocaleString()}
                                </span>
                                {item.paidAmount && item.paidAmount > 0 && !isSettled && (
                                  <p className="text-xs text-muted">
                                    পরিশোধ: {item.currency} {item.paidAmount} | বাকি:{" "}
                                    <strong className="text-foreground">
                                      {item.currency} {remaining}
                                    </strong>
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              {!isSettled ? (
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    onClick={() => handlePartialPayment(person.personId, item.id)}
                                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-surface border border-border text-foreground hover:bg-surface-2 transition-theme"
                                  >
                                    আংশিক পরিশোধ
                                  </button>
                                  <button
                                    onClick={() => handleMarkSettled(person.personId, item.id)}
                                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent-hover transition-theme shadow-sm flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    পরিশোধ সম্পন্ন
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted flex items-center gap-1 italic">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-success" /> সম্পূর্ণ পরিশোধিত
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
