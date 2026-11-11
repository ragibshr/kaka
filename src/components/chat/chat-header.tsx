"use client";

import { Settings, MoreVertical } from "lucide-react";
import Link from "next/link";

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Kaka avatar */}
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-lg">K</span>
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground">Kaka</h1>
          <p className="text-xs text-success flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
            অনলাইন
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Link
          href="/settings"
          className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-theme"
        >
          <Settings className="w-5 h-5" />
        </Link>
        <Link
          href="/diagnostics"
          className="w-10 h-10 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface transition-theme"
        >
          <MoreVertical className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
}
