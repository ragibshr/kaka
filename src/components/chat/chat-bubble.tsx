"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  timestamp: Date;
  savedChip?: { category: string; status: "saved" | "pending" | "error" };
}

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-end gap-2 max-w-[85%] md:max-w-[65%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar — only for Kaka */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mb-1">
          <span className="text-white text-sm font-bold">K</span>
        </div>
      )}

      <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words",
            isUser
              ? "bg-accent text-white rounded-2xl rounded-br-md"
              : "bg-kaka-bubble text-foreground rounded-2xl rounded-bl-md"
          )}
          style={{ lineHeight: "1.6" }}
        >
          {message.content}
        </div>

        {/* Meta row: time + provider + saved chip */}
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[11px] text-muted">
            {format(message.timestamp, "h:mm a")}
          </span>

          {/* Provider tag */}
          {message.provider && !isUser && (
            <span className="text-[10px] text-muted bg-surface-2 px-1.5 py-0.5 rounded">
              {message.provider}
            </span>
          )}

          {/* Saved chip */}
          {message.savedChip && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full",
                message.savedChip.status === "saved" &&
                  "bg-green-50 text-success",
                message.savedChip.status === "pending" &&
                  "bg-yellow-50 text-warning",
                message.savedChip.status === "error" &&
                  "bg-red-50 text-danger"
              )}
            >
              {message.savedChip.status === "saved" && (
                <CheckCircle2 className="w-3 h-3" />
              )}
              {message.savedChip.status === "pending" && (
                <Clock className="w-3 h-3" />
              )}
              {message.savedChip.status === "error" && (
                <AlertCircle className="w-3 h-3" />
              )}
              {message.savedChip.status === "saved"
                ? `Saved ✓ ${message.savedChip.category}`
                : message.savedChip.status === "pending"
                ? "Confirming..."
                : "Failed — tap to retry"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
