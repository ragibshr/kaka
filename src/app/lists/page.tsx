"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Briefcase,
  Utensils,
  Wallet,
  Activity,
  Users,
  GraduationCap,
  FileText,
  Clock,
  Calendar,
  Tag,
  Plus,
  SlidersHorizontal,
  CheckCircle2,
  X,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { discardEntry } from "@/lib/entries";
import { loadEntries, bn, money, timeBn, dateBn, MEAL_BN, HEALTH_BN, CHANNEL_BN, FIN_BN, type EntryRow } from "@/lib/data";

// Category definitions
type CategoryKey =
  | "all"
  | "work"
  | "food"
  | "finance"
  | "health"
  | "social"
  | "career"
  | "note";

interface CategoryTab {
  key: CategoryKey;
  label: string;
  icon: React.ElementType;
}

const categories: CategoryTab[] = [
  { key: "all", label: "সব", icon: SlidersHorizontal },
  { key: "work", label: "কাজ", icon: Briefcase },
  { key: "food", label: "খাবার", icon: Utensils },
  { key: "finance", label: "আর্থিক", icon: Wallet },
  { key: "health", label: "স্বাস্থ্য", icon: Activity },
  { key: "social", label: "সামাজিক", icon: Users },
  { key: "career", label: "ক্যারিয়ার", icon: GraduationCap },
  { key: "note", label: "নোট", icon: FileText },
];

// List entry interface
interface ListEntry {
  id: string;
  category: CategoryKey;
  title: string;
  subtitle?: string;
  time: string;
  date: string;
  keyFields: { label: string; value: string }[];
  tag?: string;
  status?: "completed" | "pending" | "info";
}

function toListEntry(e: EntryRow): ListEntry {
  const d = (e.detail ?? {}) as Record<string, any>;
  const base = { id: e.id, time: timeBn(e.occurred_at), date: dateBn(e.occurred_at), subtitle: e.raw_text };
  switch (e.category) {
    case "work":
      return {
        ...base,
        category: "work",
        title: d.hours ? `কাজ — ${bn(d.hours)} ঘণ্টা` : "কাজ",
        keyFields: [
          ...(d.punch_in ? [{ label: "ঢুকলাম", value: bn(String(d.punch_in).slice(0, 5)) }] : []),
          ...(d.punch_out ? [{ label: "বের হলাম", value: bn(String(d.punch_out).slice(0, 5)) }] : []),
          ...(d.notes ? [{ label: "নোট", value: d.notes }] : []),
        ],
      };
    case "food":
      return {
        ...base,
        category: "food",
        title: d.description || "খাবার",
        tag: MEAL_BN[d.meal_type] ?? "খাবার",
        keyFields: d.cost != null ? [{ label: "দাম", value: money(d.cost, d.currency) }] : [],
      };
    case "finance":
    case "debt": {
      if (e.category === "debt") {
        return {
          ...base,
          category: "finance",
          title: `${d.counterparty} — ${d.direction === "lent" ? "ধার দিলাম" : "ধার নিলাম"}`,
          tag: "ধার",
          keyFields: [{ label: "পরিমাণ", value: money(d.amount, d.currency) }],
          status: d.status === "settled" ? "completed" : undefined,
        };
      }
      return {
        ...base,
        category: "finance",
        title: d.note || d.counterparty || FIN_BN[d.type] || "লেনদেন",
        tag: FIN_BN[d.type] ?? "লেনদেন",
        keyFields: [
          { label: "পরিমাণ", value: money(d.amount, d.currency) },
          ...(d.counterparty ? [{ label: "কার সাথে", value: d.counterparty }] : []),
        ],
      };
    }
    case "health":
      return {
        ...base,
        category: "health",
        title: `${HEALTH_BN[d.kind] ?? "স্বাস্থ্য"}: ${d.value ?? ""}`,
        keyFields: d.notes ? [{ label: "নোট", value: d.notes }] : [],
      };
    case "social":
      return {
        ...base,
        category: "social",
        title: d.person || "যোগাযোগ",
        tag: CHANNEL_BN[d.channel] ?? "যোগাযোগ",
        keyFields: d.duration_min ? [{ label: "সময়", value: `${bn(d.duration_min)} মিনিট` }] : [],
      };
    case "career":
      return {
        ...base,
        category: "career",
        title: d.title || "ক্যারিয়ার",
        keyFields: [
          ...(d.org ? [{ label: "প্রতিষ্ঠান", value: d.org }] : []),
          ...(d.status ? [{ label: "অবস্থা", value: d.status }] : []),
        ],
      };
    default:
      return { ...base, category: "note", title: (e.data?.text as string) || e.raw_text, subtitle: undefined, keyFields: [] };
  }
}

export default function ListsPage() {
  const [activeTab, setActiveTab] = useState<CategoryKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [entries, setEntries] = useState<ListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries(createClient())
      .then((rows) => setEntries(rows.map(toListEntry)))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("এই এন্ট্রিটা মুছে ফেলবে?")) return;
    try {
      await discardEntry(createClient(), id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert("মুছতে পারলাম না, আবার চেষ্টা করো।");
    }
  };

  // Filtered entries according to active tab and search query
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Category match
      const matchesCategory =
        activeTab === "all" || entry.category === activeTab;

      // Query match across title, subtitle, tags, and key fields
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesText =
        entry.title.toLowerCase().includes(query) ||
        (entry.subtitle && entry.subtitle.toLowerCase().includes(query)) ||
        (entry.tag && entry.tag.toLowerCase().includes(query)) ||
        entry.keyFields.some(
          (field) =>
            field.label.toLowerCase().includes(query) ||
            field.value.toLowerCase().includes(query)
        );

      return matchesCategory && matchesText;
    });
  }, [entries, activeTab, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    for (const item of entries) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [entries]);

  // Category badge colors
  const getCategoryTheme = (category: CategoryKey) => {
    switch (category) {
      case "work":
        return {
          bg: "bg-blue-50",
          text: "text-blue-600",
          border: "border-blue-200",
          icon: Briefcase,
        };
      case "food":
        return {
          bg: "bg-orange-50",
          text: "text-orange-600",
          border: "border-orange-200",
          icon: Utensils,
        };
      case "finance":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-600",
          border: "border-emerald-200",
          icon: Wallet,
        };
      case "health":
        return {
          bg: "bg-rose-50",
          text: "text-rose-600",
          border: "border-rose-200",
          icon: Activity,
        };
      case "social":
        return {
          bg: "bg-purple-50",
          text: "text-purple-600",
          border: "border-purple-200",
          icon: Users,
        };
      case "career":
        return {
          bg: "bg-indigo-50",
          text: "text-indigo-600",
          border: "border-indigo-200",
          icon: GraduationCap,
        };
      case "note":
      default:
        return {
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-200",
          icon: FileText,
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header */}
      <header className="px-4 md:px-8 py-4 border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">তালিকা</h1>
            <p className="text-xs md:text-sm text-muted">
              তোমার দৈনন্দিন সব এন্ট্রি এবং সংরক্ষিত তথ্য
            </p>
          </div>

          {/* Quick Action: New entry placeholder */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white text-xs md:text-sm font-medium rounded-xl hover:bg-accent-hover transition-theme shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>চ্যাটে লেখো</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="যেকোনো তথ্য, খরচ, কাজ বা নোট খোঁজো..."
            className={cn(
              "w-full rounded-xl border border-border bg-surface pl-9 pr-9 py-2.5",
              "text-sm text-foreground placeholder:text-muted",
              "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-theme"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Segmented Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 -mx-4 px-4 md:mx-0 md:px-0">
          {categories.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const count = categoryCounts[tab.key] || 0;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-theme shrink-0",
                  isActive
                    ? "bg-accent text-white shadow-sm"
                    : "bg-surface text-muted hover:text-foreground hover:bg-surface-2 border border-border"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-semibold",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-border text-muted"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* List Content Area */}
      {/* pb-20 on mobile to allow clearance for bottom nav bar */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-6 space-y-3">
        {loading ? (
          <div className="text-center text-sm text-muted py-12">লোড হচ্ছে...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center space-y-3 max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-full bg-surface-2 text-muted mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              কোনো তথ্য পাওয়া যায়নি
            </h3>
            <p className="text-xs text-muted">
              {searchQuery
                ? `"${searchQuery}" এর জন্য কোনো ফলাফল নেই। অন্য কিছু লিখে খোঁজো।`
                : "এখনো কিছু নেই। চ্যাটে কাকাকে দিনের কথা বলো — এখানে নিজে থেকেই জমা হবে।"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-accent font-medium hover:underline pt-2 block mx-auto"
              >
                খোঁজা মুছে দাও
              </button>
            )}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const theme = getCategoryTheme(entry.category);
            const Icon = theme.icon;

            return (
              <div
                key={entry.id}
                className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Category Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                      theme.bg,
                      theme.text,
                      theme.border
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Title and details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm md:text-base font-semibold text-foreground truncate">
                        {entry.title}
                      </h3>
                      {entry.tag && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface text-muted border border-border flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          {entry.tag}
                        </span>
                      )}
                      {entry.status === "completed" && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-green-50 text-success border border-green-200 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          সম্পন্ন
                        </span>
                      )}
                    </div>

                    {entry.subtitle && (
                      <p className="text-xs text-muted line-clamp-1">
                        {entry.subtitle}
                      </p>
                    )}

                    {/* Key Fields Grid */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs">
                      {entry.keyFields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-muted">
                          <span className="text-muted/80">{field.label}:</span>
                          <strong className="font-semibold text-foreground">
                            {field.value}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side: Time & Date */}
                <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border/60 text-xs shrink-0">
                  <div className="flex items-center gap-3 text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted/70" />
                      {entry.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted/70" />
                      {entry.time}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-red-50 transition-theme"
                    title="মুছে ফেলো"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
