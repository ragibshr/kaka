"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { ChatHeader } from "@/components/chat/chat-header";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  timestamp: Date;
  savedChip?: { category: string; status: "saved" | "pending" | "error" };
}

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content: "হ্যালো! 👋 আমি কাকা — তোমার AI সঙ্গী। তোমার দিনের যেকোনো তথ্য আমাকে বলো, আমি গুছিয়ে রাখবো। চ্যাট করো বা ভয়েস দিয়ে বলো!",
  timestamp: new Date(),
};

const quickChips = [
  "আজকের সারাংশ",
  "কত খরচ হলো আজ?",
  "কাকা, কেমন আছো?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // TODO: Call AI API route, extract data, generate reply
    // For now, show a placeholder response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "আমি এখনো সেটআপ হচ্ছি! Settings থেকে Supabase আর AI provider সংযুক্ত করো, তারপর আমি তোমার কথা বুঝতে পারবো। 🔧",
        provider: "system",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ChatHeader />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-32 md:pb-6">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
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

      {/* Quick chips */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setInput(chip);
                inputRef.current?.focus();
              }}
              className="px-3 py-2 text-sm bg-accent-light text-accent rounded-full hover:bg-accent hover:text-white transition-all"
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
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
                "w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 pr-12",
                "text-foreground placeholder:text-muted",
                "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
                "max-h-32 min-h-[48px]",
                "text-[16px]" // prevents iOS zoom
              )}
              style={{ lineHeight: "1.5" }}
            />
          </div>

          {/* Mic button */}
          <button
            className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-2 transition-theme"
            title="ভয়েস ইনপুট"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all",
              input.trim()
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
