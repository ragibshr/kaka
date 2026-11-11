"use client";

import { useState, useMemo } from "react";
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
  ChevronRight,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

// TODO: Replace with real Supabase database query / TanStack React Query hooks
const placeholderEntries: ListEntry[] = [
  // Work
  {
    id: "w1",
    category: "work",
    title: "ফ্রন্টএন্ড কম্পোনেন্ট রিফ্যাক্টরিং",
    subtitle: "KAKA ড্যাশবোর্ড ও লিস্টিং স্ক্রিন তৈরি",
    time: "দুপুর ০২:১৫",
    date: "আজ",
    keyFields: [
      { label: "সময়কাল", value: "৩ ঘণ্টা" },
      { label: "প্রকল্প", value: "KAKA Web App" },
      { label: "স্ট্যাটাস", value: "সম্পন্ন" },
    ],
    tag: "ডেভেলপমেন্ট",
    status: "completed",
  },
  {
    id: "w2",
    category: "work",
    title: "সাপ্তাহিক স্প্রিন্ট প্ল্যানিং মিটিং",
    subtitle: "টিমের সাথে প্রজেক্ট রোডম্যাপ আলোচনা",
    time: "সকাল ১১:০০",
    date: "আজ",
    keyFields: [
      { label: "সময়কাল", value: "১ ঘণ্টা" },
      { label: "উপস্থিতি", value: "৬ জন" },
    ],
    tag: "মিটিং",
    status: "completed",
  },

  // Food
  {
    id: "f1",
    category: "food",
    title: "দুপুরের খাবার: মাছ-ভাত ও সবজি",
    subtitle: "ক্যাফেটেরিয়া থেকে দুপুরের লাঞ্চ",
    time: "দুপুর ০১:৩০",
    date: "আজ",
    keyFields: [
      { label: "ব্যয়", value: "৳ ২২০" },
      { label: "ধরণ", value: "ভারী খাবার" },
      { label: "ক্যালোরি", value: "~৬৫০ kcal" },
    ],
    tag: "লাঞ্চ",
    status: "info",
  },
  {
    id: "f2",
    category: "food",
    title: "সকালের নাস্তা: ওটস ও ফল",
    subtitle: "কলা ও কাঠবাদাম সহ দুধ-ওটস",
    time: "সকাল ০৮:৩০",
    date: "আজ",
    keyFields: [
      { label: "ব্যয়", value: "৳ ৬০" },
      { label: "ধরণ", value: "স্বাস্থ্যকর" },
    ],
    tag: "নাস্তা",
    status: "info",
  },

  // Finance
  {
    id: "fn1",
    category: "finance",
    title: "গ্রোসারি কেনাকাটা",
    subtitle: "সুপারশপ থেকে নিত্যপ্রয়োজনীয় জিনিসপত্র",
    time: "সন্ধ্যা ০৬:৪৫",
    date: "গতকাল",
    keyFields: [
      { label: "পরিমাণ", value: "৳ ১,৮৫০" },
      { label: "লেনদেনের ধরণ", value: "বিকাশ" },
      { label: "খাত", value: "বাজার" },
    ],
    tag: "ব্যয়",
    status: "info",
  },
  {
    id: "fn2",
    category: "finance",
    title: "ফ্রিল্যান্স প্রজেক্টের পেমেন্ট প্রাপ্তি",
    subtitle: "UI ডিজাইন কাজের প্রথম কিস্তি",
    time: "বিকাল ০৪:০০",
    date: "৮ অক্টোবর",
    keyFields: [
      { label: "পরিমাণ", value: "+৳ ১৫,০০০" },
      { label: "পদ্ধতি", value: "ব্যাংক ট্রান্সফার" },
      { label: "উৎস", value: "ক্লায়েন্ট" },
    ],
    tag: "আয়",
    status: "completed",
  },

  // Health
  {
    id: "h1",
    category: "health",
    title: "সন্ধ্যায় জিম ও স্ট্রেচিং",
    subtitle: "বুকের ব্যায়াম ও ৩০ মিনিট ট্রেডমিল",
    time: "সন্ধ্যা ০৭:০০",
    date: "গতকাল",
    keyFields: [
      { label: "সময়কাল", value: "৪৫ মিনিট" },
      { label: "ক্যালোরি বার্ন", value: "৩২০ kcal" },
      { label: "অনুভূতি", value: "চাঙ্গা" },
    ],
    tag: "শরীরচর্চা",
    status: "completed",
  },
  {
    id: "h2",
    category: "health",
    title: "রক্তচাপ ও সুগার চেক",
    subtitle: "স্বাভাবিক রেঞ্জের মধ্যে রয়েছে",
    time: "সকাল ০৯:০০",
    date: "৭ অক্টোবর",
    keyFields: [
      { label: "বিপি", value: "১২০/৮০" },
      { label: "সুগার", value: "৫.৪ mmol/L" },
    ],
    tag: "মেডিকেল",
    status: "completed",
  },

  // Social
  {
    id: "s1",
    category: "social",
    title: "বন্ধুদের সাথে আড্ডা ও কফি",
    subtitle: "ধানমন্ডি লেকে সান্ধ্যকালীন দেখা",
    time: "রাত ০৮:০০",
    date: "গত পরশু",
    keyFields: [
      { label: "ব্যক্তি", value: "তানভীর, সাকিব" },
      { label: "সময়কাল", value: "২ ঘণ্টা" },
      { label: "স্থান", value: "ক্যাফে রেইন" },
    ],
    tag: "বন্ধু",
    status: "info",
  },

  // Career
  {
    id: "c1",
    category: "career",
    title: "নেক্সট জেএস ১৫ কোর্স মডিউল সমাপ্ত",
    subtitle: "সার্ভার অ্যাকশন এবং ক্যাশিং স্ট্র্যাটেজি শেখা",
    time: "রাত ১০:০০",
    date: "৬ অক্টোবর",
    keyFields: [
      { label: "কোর্স", value: "Advanced Next.js" },
      { label: "অগ্রগতি", value: "৮০%" },
      { label: "নোট সংখ্যা", value: "৪টি" },
    ],
    tag: "শেখা",
    status: "completed",
  },

  // Notes
  {
    id: "n1",
    category: "note",
    title: "ভবিষ্যত ব্যবসার আইডিয়া: কাকা এআই অ্যাসিস্ট্যান্ট",
    subtitle: "ব্যক্তিগত ডাটা প্রাইভেসি এবং স্থানীয় ভাষা সমর্থন নিয়ে চিন্তা",
    time: "দুপুর ১২:০০",
    date: "৫ অক্টোবর",
    keyFields: [
      { label: "ধরন", value: "আইডিয়া" },
      { label: "অগ্রাধিকার", value: "উচ্চ" },
    ],
    tag: "পরিকল্পনা",
    status: "pending",
  },
];

export default function ListsPage() {
  const [activeTab, setActiveTab] = useState<CategoryKey>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered entries according to active tab and search query
  const filteredEntries = useMemo(() => {
    return placeholderEntries.filter((entry) => {
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
  }, [activeTab, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: placeholderEntries.length };
    for (const item of placeholderEntries) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, []);

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
          <button
            onClick={() => {
              // TODO: Open modal or drawer for adding new entry
              alert("নতুন এন্ট্রি যোগ করার সুবিধা শীঘ্রই আসছে!");
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white text-xs md:text-sm font-medium rounded-xl hover:bg-accent-hover transition-theme shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন এন্ট্রি</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="যেকোনো তথ্য, খরচ, কাজ বা নোট খুঁজুন..."
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
        {filteredEntries.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center space-y-3 max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-full bg-surface-2 text-muted mx-auto flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              কোনো তথ্য পাওয়া যায়নি
            </h3>
            <p className="text-xs text-muted">
              {searchQuery
                ? `"${searchQuery}" এর জন্য কোনো ফলাফল নেই। অন্য কিছু লিখে খুঁজুন।`
                : "এই ক্যাটাগরিতে এখনো কোনো এন্ট্রি যোগ করা হয়নি।"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-accent font-medium hover:underline pt-2 block mx-auto"
              >
                অনুসন্ধান মুছুন
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
                    onClick={() => {
                      // TODO: View or edit item details
                    }}
                    className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-theme"
                    title="বিস্তারিত দেখুন"
                  >
                    <ChevronRight className="w-4 h-4" />
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
