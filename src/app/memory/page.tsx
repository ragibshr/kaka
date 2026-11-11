"use client";

import { useState, useMemo, useEffect } from "react";
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
import { createClient } from "@/lib/supabase/client";

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

const LAYER_TO_SECTION: Record<string, MemorySection> = { core: "core", episodic: "events", pattern: "patterns" };
const SECTION_TO_LAYER: Record<MemorySection, string> = { core: "core", events: "episodic", patterns: "pattern" };
const SECTION_LABEL: Record<MemorySection, string> = { core: "মূল তথ্য", events: "ঘটনা", patterns: "অভ্যাস" };

export default function MemoryPage() {
  const [activeSection, setActiveSection] = useState<MemorySection>("core");
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from("memories")
      .select("id, layer, content, importance, pinned, status, created_at")
      .is("deleted_at", null)
      .neq("status", "rejected")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMemories(
          (data ?? []).map((m) => {
            const section = LAYER_TO_SECTION[m.layer] ?? "core";
            return {
              id: m.id,
              section,
              content: m.content,
              categoryLabel: SECTION_LABEL[section],
              importance: m.importance,
              isPinned: m.pinned,
              status: m.status === "approved" ? "approved" : "proposed",
              createdAt: new Date(m.created_at).toLocaleDateString("bn-BD", { day: "numeric", month: "short" }),
            } satisfies MemoryItem;
          })
        );
        setLoading(false);
      });
  }, []);

  const save = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await createClient().from("memories").update(patch).eq("id", id);
    if (error) alert("সেভ করা গেল না, আবার চেষ্টা করো।");
    return !error;
  };
  const [searchQuery, setSearchQuery] = useState("");

  // Tabs configuration
  const tabs = [
    { key: "core" as MemorySection, label: "মূল তথ্য (Core)", icon: Layers },
    { key: "events" as MemorySection, label: "ঘটনা (Events)", icon: Calendar },
    { key: "patterns" as MemorySection, label: "অভ্যাস (Patterns)", icon: Repeat },
  ];

  // Actions
  const handleApprove = async (id: string) => {
    if (!(await save(id, { status: "approved" }))) return;
    setMemories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "approved" } : item))
    );
  };

  const handleReject = async (id: string) => {
    if (!(await save(id, { status: "rejected" }))) return;
    setMemories((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDelete = async (id: string) => {
    if (confirm("তুমি কি নিশ্চিতভাবে এই তথ্যটি মুছে ফেলতে চাও?")) {
      if (!(await save(id, { deleted_at: new Date().toISOString() }))) return;
      setMemories((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleTogglePin = async (id: string) => {
    const item = memories.find((m) => m.id === id);
    if (!item || !(await save(id, { pinned: !item.isPinned }))) return;
    setMemories((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
  };

  const handleUpdateImportance = async (id: string, stars: number) => {
    if (!(await save(id, { importance: stars }))) return;
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
            onClick={async () => {
              const newContent = prompt("কাকাকে নতুন কী মনে রাখতে বলতে চাও?");
              if (newContent?.trim()) {
                const { data, error } = await createClient()
                  .from("memories")
                  .insert({ layer: SECTION_TO_LAYER[activeSection], content: newContent.trim(), status: "approved", importance: 3 })
                  .select("id")
                  .single();
                if (error || !data) return alert("সেভ করা গেল না, আবার চেষ্টা করো।");
                const newItem: MemoryItem = {
                  id: data.id,
                  section: activeSection,
                  content: newContent,
                  categoryLabel: SECTION_LABEL[activeSection],
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
            <span>নতুন স্মৃতি যুক্ত করো</span>
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

        {loading ? (
          <div className="text-center text-sm text-muted py-12">লোড হচ্ছে...</div>
        ) : displayedMemories.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-8 text-center space-y-2 max-w-md mx-auto my-12">
            <Brain className="w-8 h-8 text-muted mx-auto" />
            <h3 className="text-base font-semibold text-foreground">
              কোনো স্মৃতি পাওয়া যায়নি
            </h3>
            <p className="text-xs text-muted">
              {searchQuery
                ? `"${searchQuery}" এর সাথে মেলে এমন কোনো তথ্য নেই।`
                : "এখনো কিছু নেই। ওপরের বাটন দিয়ে যোগ করো — কাকা চ্যাটে এগুলো মাথায় রাখবে। চ্যাট থেকে নিজে নিজে মনে রাখার সুবিধা পরের ধাপে আসছে।"}
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
                            অনুমোদন করো
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
                            title={item.isPinned ? "পিন আনপিন করো" : "পিন করো"}
                          >
                            <Pin className="w-4 h-4" />
                          </button>

                          {/* Edit placeholder */}
                          <button
                            onClick={() => {
                              const updated = prompt("তথ্যটি সম্পাদনা করো:", item.content);
                              if (updated && updated.trim()) {
                                void save(item.id, { content: updated.trim() });
                                setMemories((prev) =>
                                  prev.map((m) =>
                                    m.id === item.id ? { ...m, content: updated.trim() } : m
                                  )
                                );
                              }
                            }}
                            className="p-1.5 rounded-lg border border-border bg-white text-muted hover:text-foreground hover:bg-surface transition-theme"
                            title="সম্পাদনা করো"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg border border-border bg-white text-muted hover:text-danger hover:border-danger/30 hover:bg-rose-50 transition-theme"
                            title="মুছে ফেলো"
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
