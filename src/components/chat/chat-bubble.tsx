"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CheckCircle2, Undo2, AlertCircle } from "lucide-react";

export interface ChatChip {
  entryId: string;
  label: string;
  undone?: boolean;
}

export interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string | null;
  timestamp: Date;
  chips?: ChatChip[];
  failed?: boolean;
}

interface ChatBubbleProps {
  message: UiMessage;
  onUndo?: (entryId: string) => void;
}

export function ChatBubble({ message, onUndo }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-end gap-2 max-w-[85%] md:max-w-[65%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mb-1">
          <span className="text-white text-sm font-bold">K</span>
        </div>
      )}

      <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-2.5 text-[15px] whitespace-pre-wrap break-words",
            isUser
              ? "bg-accent text-white rounded-2xl rounded-br-md"
              : "bg-kaka-bubble text-foreground rounded-2xl rounded-bl-md",
            message.failed && "border border-red-200"
          )}
          style={{ lineHeight: "1.6" }}
        >
          {message.content}
        </div>

        {/* Saved chips (shown under the user's message) */}
        {message.chips && message.chips.length > 0 && (
          <div className={cn("flex flex-wrap gap-1.5 mt-1.5", isUser ? "justify-end" : "justify-start")}>
            {message.chips.map((chip) => (
              <span
                key={chip.entryId}
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] pl-2 pr-1 py-0.5 rounded-full border",
                  chip.undone
                    ? "bg-surface text-muted border-border line-through"
                    : "bg-green-50 text-success border-green-200"
                )}
              >
                <CheckCircle2 className="w-3 h-3" />
                {chip.label}
                {!chip.undone && onUndo && (
                  <button
                    onClick={() => onUndo(chip.entryId)}
                    title="বাতিল করো"
                    className="!min-h-0 !min-w-0 ml-0.5 p-0.5 rounded-full hover:bg-green-100"
                  >
                    <Undo2 className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[11px] text-muted">{format(message.timestamp, "h:mm a")}</span>
          {message.failed && (
            <span className="inline-flex items-center gap-1 text-[11px] text-danger">
              <AlertCircle className="w-3 h-3" /> সমস্যা হয়েছে
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
