"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  LayoutDashboard,
  List,
  Brain,
  BarChart3,
  Wallet,
  Settings,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: MessageCircle, label: "Chat", labelBn: "চ্যাট" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", labelBn: "ড্যাশবোর্ড" },
  { href: "/lists", icon: List, label: "Lists", labelBn: "তালিকা" },
  { href: "/memory", icon: Brain, label: "Memory", labelBn: "স্মৃতি" },
  { href: "/insights", icon: BarChart3, label: "Insights", labelBn: "বিশ্লেষণ" },
];

const bottomItems = [
  { href: "/debts", icon: Wallet, label: "Debts", labelBn: "ধার" },
  { href: "/settings", icon: Settings, label: "Settings", labelBn: "সেটিংস" },
  { href: "/diagnostics", icon: Activity, label: "Diagnostics", labelBn: "ডায়াগনস্টিক" },
];

export function Sidebar() {
  const pathname = usePathname();
  if (pathname === "/auth") return null;

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-surface border-r border-border">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Kaka</h1>
            <p className="text-xs text-muted">তোমার AI সঙ্গী</p>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-theme",
                isActive
                  ? "bg-accent-light text-accent"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.labelBn}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-theme",
                isActive
                  ? "bg-accent-light text-accent"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.labelBn}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
