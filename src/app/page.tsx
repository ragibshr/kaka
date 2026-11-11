"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatBubble, type UiMessage } from "@/components/chat/chat-bubble";
import { ChatHeader } from "@/components/chat/chat-header";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_BN, discardEntry } from "@/lib/entries";
import type { ChatApiResponse } from "@/ai/types";

const welcomeMessage: UiMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "হ্যালো! 👋 আমি কাকা — তোমার AI সঙ্গী। দিনের যেকোনো কথা আমাকে বলো — খরচ, খাবার, কাজ, ধার — আমি গুছিয়ে রাখবো।",
  timestamp: new Date(),
};

const quickChips = ["আজকের সারাংশ", "কত খরচ হলো আজ?", "কাকা, কেমন আছো?"];

const timeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Dubai";
  } catch {
    return "Asia/Dubai";
  }
};

export default function ChatPage() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load the last 50 messages (+ their saved entries) from Supabase
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: rows } = await supabase
        .from("messages")
        .select("id, role, content, provider, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      const list = (rows ?? []).reverse();
      const userIds = list.filter((m) => m.role === "user").map((m) => m.id);
      const chipsByMsg: Record<string, UiMessage["chips"]> = {};
      if (userIds.length) {
        const { data: entries } = await supabase
          .from("entries")
          .select("id, category, source_message_id")
          .in("source_message_id", userIds)
          .is("deleted_at", null);
        for (const e of entries ?? []) {
          const key = e.source_message_id as string;
          (chipsByMsg[key] ??= []).push({ entryId: e.id, label: CATEGORY_BN[e.category] ?? e.category });
        }
      }
      setMessages(
        list.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          provider: m.provider,
          timestamp: new Date(m.created_at),
          chips: chipsByMsg[m.id],
        }))
      );
      setHistoryLoaded(true);
    })();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isLoading) return;
      const tempId = `local-${crypto.randomUUID()}`;
      setMessages((prev) => [...prev, { id: tempId, role: "user", content: text, timestamp: new Date() }]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, timeZone: timeZone() }),
        });
        if (res.status === 401) {
          window.location.href = "/auth";
          return;
        }
        const data = (await res.json()) as ChatApiResponse;
        setMessages((prev) => [
          ...prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: data.userMessageId ?? tempId,
                  chips: data.saved?.map((s) => ({ entryId: s.entryId, label: s.label })),
                }
              : m
          ),
          {
            id: data.assistantMessageId ?? `local-${crypto.randomUUID()}`,
            role: "assistant",
            content: data.reply ?? data.error ?? "কিছু একটা সমস্যা হয়েছে।",
            provider: data.model,
            timestamp: new Date(),
            failed: !res.ok,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `local-${crypto.randomUUID()}`,
            role: "assistant",
            content: "ইন্টারনেট সংযোগে সমস্যা। আবার চেষ্টা করো।",
            timestamp: new Date(),
            failed: true,
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading]
  );

  const handleUndo = useCallback(async (entryId: string) => {
    try {
      await discardEntry(createClient(), entryId);
      setMessages((prev) =>
        prev.map((m) =>
          m.chips?.some((c) => c.entryId === entryId)
            ? { ...m, chips: m.chips.map((c) => (c.entryId === entryId ? { ...c, undone: true } : c)) }
            : m
        )
      );
    } catch {
      alert("বাতিল করা গেল না, আবার চেষ্টা করো।");
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText(input);
    }
  };

  const shown = historyLoaded && messages.length === 0 ? [welcomeMessage] : messages;

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-32 md:pb-6">
        {!historyLoaded && (
          <div className="flex justify-center py-10 text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        {shown.map((msg) => (
          <ChatBubble key={msg.id} message={msg} onUndo={handleUndo} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            <div className="bg-kaka-bubble rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {historyLoaded && messages.length <= 1 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => sendText(chip)}
              className="px-3 py-2 text-sm bg-accent-light text-accent rounded-full hover:bg-accent hover:text-white transition-all"
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              {chip}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-border bg-white p-3 mb-16 md:mb-0">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="তোমার কথা লেখো..."
              rows={1}
              className={cn(
                "w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3",
                "text-foreground placeholder:text-muted",
                "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
                "max-h-32 min-h-[48px] text-[16px]"
              )}
              style={{ lineHeight: "1.5" }}
            />
          </div>

          {/* Voice input arrives in step 6 */}
          <button
            disabled
            className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-muted opacity-50 cursor-not-allowed"
            title="ভয়েস ইনপুট (শীঘ্রই আসছে)"
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            onClick={() => sendText(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all",
              input.trim() && !isLoading
                ? "bg-accent text-white hover:bg-accent-hover shadow-md"
                : "bg-surface-2 text-muted cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
