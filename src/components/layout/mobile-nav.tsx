"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  LayoutDashboard,
  List,
  Brain,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: MessageCircle, label: "চ্যাট" },
  { href: "/dashboard", icon: LayoutDashboard, label: "ড্যাশবোর্ড" },
  { href: "/lists", icon: List, label: "তালিকা" },
  { href: "/memory", icon: Brain, label: "স্মৃতি" },
  { href: "/insights", icon: BarChart3, label: "বিশ্লেষণ" },
];

export function MobileNav() {
  const pathname = usePathname();

  // Hide on auth pages
  if (pathname === "/auth") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl min-w-0 transition-theme",
                isActive ? "text-accent" : "text-muted"
              )}
            >
              <item.icon
                className={cn("w-5 h-5", isActive && "stroke-[2.5]")}
              />
              <span className="text-[10px] font-medium truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
