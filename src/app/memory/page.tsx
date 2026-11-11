"use client";

import { useState, useMemo } from "react";
import {
  Brain,
  Sparkles,
  Pin,
  Star,
  Check,
  X,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  Repeat,
  Search,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Memory section type
type MemorySection = "core" | "events" | "patterns";

interface MemoryItem {
  id: string;
  section: MemorySection;
  content: string;
  categoryLabel: string;
  importance: number; // 1 to 5 stars
  isPinned: boolean;
  status: "proposed" | "approved"; // "proposed" gets 'New' badge and Approve/Reject
  createdAt: string;
  sourceNote?: string;
}

// TODO: Replace with real Supabase vector database / memory storage queries
const initialMemories: MemoryItem[] = [
  // Core (মূল তথ্য)
  {
    id: "m1",
    section: "core",
    content: "চা বা কফিতে অতিরিক্ত চিনি পছন্দ করো না, সাধারণত লাল চা বা ব্ল্যাক কফি পান করো।",
    categoryLabel: "খাবারের পছন্দ",
    importance: 4,
    isPinned: true,
    status: "approved",
    createdAt: "৩ অক্টোবর ২০২৬",
    sourceNote: "কথোপকথন থেকে সংরক্ষিত",
  },
  {
    id: "m2",
    section: "core",
    content: "তোমার মায়ের জন্মদিন ১৫ নভেম্বর এবং প্রিয় ফুল রজনীগন্ধা।",
    categoryLabel: "পারিবারিক তথ্য",
    importance: 5,
    isPinned: true,
    status: "approved",
    createdAt: "১ অক্টোবর ২০২৬",
    sourceNote: "ব্যবহারকারী সরাসরি উল্লেখ করেছেন",
  },
  {
    id: "m3",
    section: "core",
    content: "সামুদ্রিক চিংড়ি মাছে সামান্য এলার্জি রয়েছে।",
    categoryLabel: "স্বাস্থ্য সতর্কতা",
    importance: 5,
    isPinned: false,
    status: "proposed",
    createdAt: "আজ সকাল ১০:২০",
    sourceNote: "কাকার প্রস্তাবিত (আজকের চ্যাট বিশ্লেষণ)",
  },

  // Events (ঘটনা)
  {
    id: "m4",
    section: "events",
    content: "১২ অক্টোবর সকাল ১০টায় ক্লায়েন্ট প্রেজেন্টেশন ও ডেমো সেশন নির্ধারিত আছে।",
    categoryLabel: "কর্মক্ষেত্র",
    importance: 5,
    isPinned: true,
    status: "approved",
    createdAt: "৫ অক্টোবর ২০২৬",
    sourceNote: "ক্যালেন্ডার ও মেসেজ",
  },
  {
    id: "m5",
    section: "events",
    content: "গত মাসে নেক্সট জেএস প্রজেক্ট সফলভাবে ডেপ্লয় করার জন্য টিম পার্টি হয়েছিল।",
    categoryLabel: "অর্জন",
    importance: 3,
    isPinned: false,
    status: "approved",
    createdAt: "২০ সেপ্টেম্বর ২০২৬",
  },
  {
    id: "m6",
    section: "events",
    content: "১৮ অক্টোবর বন্ধু তানভীরের বিবাহোত্তর সংবর্ধনা অনুষ্ঠানে যাওয়ার কথা।",
    categoryLabel: "সামাজিক উৎসব",
    importance: 4,
    isPinned: false,
    status: "proposed",
    createdAt: "গতকাল সন্ধ্যা",
    sourceNote: "কাকার প্রস্তাবিত (চ্যাটের বার্তা)",
  },

  // Patterns (অভ্যাস)
  {
    id: "m7",
    section: "patterns",
    content: "সাধারণত রাত ১টা থেকে ১:৩০ এর মধ্যে ঘুমাতে যাও এবং সকাল ৮টা থেকে ৮:৩০ এর মধ্যে ঘুম থেকে ওঠো।",
    categoryLabel: "ঘুমের রুটিন",
    importance: 4,
    isPinned: true,
    status: "approved",
    createdAt: "২ অক্টোবর ২০২৬",
    sourceNote: "দৈনিক পাঞ্চ-ইন এবং অ্যাক্টিভিটি প্যাটার্ন",
  },
  {
    id: "m8",
    section: "patterns",
    content: "কাজের মাঝে প্রতি দেড় থেকে দুই ঘণ্টা পরপর ১০ মিনিটের ছোট বিরতি নিলে কাজের গতি বাড়ে।",
    categoryLabel: "কাজের ছন্দ",
    importance: 3,
    isPinned: false,
    status: "approved",
    createdAt: "২৮ সেপ্টেম্বর ২০২৬",
  },
  {
    id: "m9",
    section: "patterns",
    content: "প্রতি শুক্রবার বিকেলে গ্রোসারি বাজার ও আর্থিক হিসাব মেলানোর অভ্যাস গড়ে উঠেছে।",
    categoryLabel: "সাপ্তাহিক রুটিন",
    importance: 4,
    isPinned: false,
    status: "proposed",
    createdAt: "আজ দুপুর ০১:০০",
    sourceNote: "কাকার প্রস্তাবিত (লেনদেন হিস্ট্রি পর্যবেক্ষণ)",
  },
];

export default function MemoryPage() {
  const [activeSection, setActiveSection] = useState<MemorySection>("core");
  const [memories, setMemories] = useState<MemoryItem[]>(initialMemories);
  const [searchQuery, setSearchQuery] = useState("");

  // Tabs configuration
  const tabs = [
    { key: "core" as MemorySection, label: "মূল তথ্য (Core)", icon: Layers },
    { key: "events" as MemorySection, label: "ঘটনা (Events)", icon: Calendar },
    { key: "patterns" as MemorySection, label: "অভ্যাস (Patterns)", icon: Repeat },
  ];

  // Actions
  const handleApprove = (id: string) => {
    // TODO: Send Supabase mutation to set status='approved'
    setMemories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "approved" } : item))
    );
  };

  const handleReject = (id: string) => {
    // TODO: Send Supabase mutation to delete or reject item
    setMemories((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDelete = (id: string) => {
    if (confirm("তুমি কি নিশ্চিতভাবে এই তথ্যটি মুছে ফেলতে চাও?")) {
      // TODO: Delete from Supabase
      setMemories((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleTogglePin = (id: string) => {
    // TODO: Update pinned status in Supabase
    setMemories((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
  };

  const handleUpdateImportance = (id: string, stars: number) => {
    // TODO: Update importance in Supabase
    setMemories((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, importance: stars } : item
      )
    );
  };

  // Filtered and sorted memories
  const displayedMemories = useMemo(() => {
    return memories
      .filter((item) => {
        const matchesSection = item.section === activeSection;
        if (!matchesSection) return false;

        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;

        return (
          item.content.toLowerCase().includes(query) ||
          item.categoryLabel.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // Pinned items first, then proposed new items, then importance
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (a.status !== b.status) return a.status === "proposed" ? -1 : 1;
        return b.importance - a.importance;
      });
  }, [memories, activeSection, searchQuery]);

  // Section item counts
  const sectionCounts = useMemo(() => {
    const counts: Record<MemorySection, { total: number; proposed: number }> = {
      core: { total: 0, proposed: 0 },
      events: { total: 0, proposed: 0 },
      patterns: { total: 0, proposed: 0 },
    };

    memories.forEach((m) => {
      counts[m.section].total++;
      if (m.status === "proposed") {
        counts[m.section].proposed++;
      }
    });

    return counts;
  }, [memories]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header */}
      <header className="px-4 md:px-8 py-4 border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">স্মৃতি ও মেমোরি</h1>
              <span className="px-2 py-0.5 rounded-full bg-accent-light text-accent text-xs font-semibold">
                AI Memory Bank
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted">
              কাকা তোমার পছন্দ, ঘটনা এবং অভ্যাস সম্পর্কে যা যা মনে রেখেছে
            </p>
          </div>

          <button
            onClick={() => {
              // TODO: Open manual memory creation modal
              const newContent = prompt("কাকাকে নতুন কী মনে রাখতে বলতে চাও?");
              if (newContent) {
                const newItem: MemoryItem = {
                  id: crypto.randomUUID(),
                  section: activeSection,
                  content: newContent,
                  categoryLabel: "ব্যক্তিগত নোট",
                  importance: 3,
                  isPinned: false,
                  status: "approved",
                  createdAt: "এখন",
                  sourceNote: "সরাসরি যুক্ত করা",
                };
                setMemories((prev) => [newItem, ...prev]);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white text-xs md:text-sm font-medium rounded-xl hover:bg-accent-hover transition-theme shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন স্মৃতি যুক্ত করুন</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="স্মৃতি ও তথ্যের মধ্যে অনুসন্ধান..."
            className={cn(
              "w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2",
              "text-xs md:text-sm text-foreground placeholder:text-muted",
              "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-theme"
            )}
          />
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 border-b border-border/60 -mb-4 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.key;
            const counts = sectionCounts[tab.key];

            return (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key)}
                className={cn(
                  "flex items-center gap-2 pb-3 px-3 text-xs md:text-sm font-semibold transition-theme border-b-2 -mb-[1px]",
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {counts.proposed > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-accent text-white text-[10px] font-bold">
                    {counts.proposed} নতুন
                  </span>
                ) : (
                  <span className="text-xs text-muted font-normal">
                    ({counts.total})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      {/* pb-20 on mobile to allow clearance for bottom nav bar */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-6 space-y-4">
        {/* Info Banner for Proposed Memories */}
        {sectionCounts[activeSection].proposed > 0 && (
          <div className="bg-blue-50/70 border border-accent/30 rounded-xl p-3 md:p-4 flex items-center justify-between gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-accent shrink-0" />
              <p className="text-foreground">
                কাকা তোমার সাম্প্রতিক কার্যকলাপ ও বার্তা পর্যবেক্ষণ করে নতুন{" "}
                <strong className="text-accent">
                  {sectionCounts[activeSection].proposed}টি তথ্য
                </strong>{" "}
                প্রস্তাব করেছে। অনুমোদন অথবা প্রত্যাখ্যান করো।
              </p>
            </div>
          </div>
        )}

        {displayedMemories.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center space-y-2 max-w-md mx-auto my-12">
            <Brain className="w-8 h-8 text-muted mx-auto" />
            <h3 className="text-base font-semibold text-foreground">
              কোনো স্মৃতি পাওয়া যায়নি
            </h3>
            <p className="text-xs text-muted">
              {searchQuery
                ? `"${searchQuery}" এর সাথে মেলে এমন কোনো তথ্য নেই।`
                : "এই বিভাগে এখনো কোনো তথ্য সংরক্ষিত নেই। কাকার সাথে কথা বললে কাকা স্বয়ংক্রিয়ভাবে তথ্য মনে রাখবে!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {displayedMemories.map((item) => {
              const isProposed = item.status === "proposed";

              return (
                <div
                  key={item.id}
                  className={cn(
                    "bg-white border rounded-xl p-4 md:p-5 shadow-sm transition-all",
                    isProposed
                      ? "border-accent/40 bg-accent-light/10 ring-1 ring-accent/20"
                      : "border-border hover:shadow-md"
                  )}
                >
                  {/* Top line: Category, Proposed Badge, Pinned, Importance */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      {isProposed && (
                        <span className="px-2 py-0.5 rounded-full bg-accent text-white text-[11px] font-bold flex items-center gap-1 shadow-sm animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          নতুন প্রস্তাবিত
                        </span>
                      )}

                      <span className="px-2.5 py-0.5 rounded-md bg-surface border border-border text-xs font-medium text-foreground">
                        {item.categoryLabel}
                      </span>

                      {item.isPinned && !isProposed && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-1">
                          <Pin className="w-3 h-3 text-amber-600 fill-amber-600" />
                          পিন করা
                        </span>
                      )}
                    </div>

                    {/* Importance 1-5 Stars */}
                    <div className="flex items-center gap-1 bg-surface px-2 py-1 rounded-lg border border-border/80">
                      <span className="text-[10px] text-muted mr-1 hidden sm:inline">
                        গুরুত্ব:
                      </span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleUpdateImportance(item.id, star)}
                          title={`${star} তারা গুরুত্ব`}
                          className="p-0.5 text-muted hover:text-amber-500 transition-colors"
                        >
                          <Star
                            className={cn(
                              "w-3.5 h-3.5",
                              star <= item.importance
                                ? "text-amber-500 fill-amber-400"
                                : "text-border"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Memory Content */}
                  <div className="py-1">
                    <p className="text-sm md:text-base text-foreground font-medium leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  {/* Metadata & Actions row */}
                  <div className="mt-3 pt-3 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted">
                    <div className="flex items-center gap-3">
                      <span>সংরক্ষণ: {item.createdAt}</span>
                      {item.sourceNote && (
                        <span className="hidden md:inline">• {item.sourceNote}</span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isProposed ? (
                        <>
                          <button
                            onClick={() => handleReject(item.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-danger hover:bg-rose-50 transition-theme font-medium"
                          >
                            <X className="w-3.5 h-3.5" />
                            প্রত্যাখ্যান
                          </button>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-theme shadow-sm font-semibold"
                          >
                            <Check className="w-3.5 h-3.5" />
                            অনুমোদন করুন
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Toggle Pin */}
                          <button
                            onClick={() => handleTogglePin(item.id)}
                            className={cn(
                              "p-1.5 rounded-lg border transition-theme",
                              item.isPinned
                                ? "bg-amber-50 border-amber-300 text-amber-700"
                                : "bg-white border-border text-muted hover:text-foreground hover:bg-surface"
                            )}
                            title={item.isPinned ? "পিন আনপিন করুন" : "পিন করুন"}
                          >
                            <Pin className="w-4 h-4" />
                          </button>

                          {/* Edit placeholder */}
                          <button
                            onClick={() => {
                              const updated = prompt("তথ্যটি সম্পাদনা করুন:", item.content);
                              if (updated && updated.trim()) {
                                setMemories((prev) =>
                                  prev.map((m) =>
                                    m.id === item.id ? { ...m, content: updated.trim() } : m
                                  )
                                );
                              }
                            }}
                            className="p-1.5 rounded-lg border border-border bg-white text-muted hover:text-foreground hover:bg-surface transition-theme"
                            title="সম্পাদনা করুন"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg border border-border bg-white text-muted hover:text-danger hover:border-danger/30 hover:bg-rose-50 transition-theme"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
