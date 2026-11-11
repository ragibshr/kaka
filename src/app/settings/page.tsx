"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Cpu,
  Globe,
  Download,
  LogOut,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Health = {
  database: { ok: boolean; messageCount: number; error?: string };
  gemini: { ok: boolean; model?: string; latencyMs?: number; error?: string };
  models: { primary: string; fallback: string };
};

const EXPORT_TABLES = [
  "messages",
  "entries",
  "work_logs",
  "food_logs",
  "finance_logs",
  "debts",
  "debt_settlements",
  "health_logs",
  "social_logs",
  "career_logs",
  "memories",
  "insights",
] as const;

function StatusPill({ ok, label }: { ok: boolean | null; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
        ok === null && "bg-surface text-muted border-border",
        ok === true && "bg-emerald-50 text-success border-emerald-200",
        ok === false && "bg-red-50 text-danger border-red-200"
      )}
    >
      {ok === true && <CheckCircle2 className="w-3.5 h-3.5" />}
      {ok === false && <XCircle className="w-3.5 h-3.5" />}
      {label}
    </span>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  right,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-border rounded-xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-light text-accent flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted">{subtitle}</p>
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [testing, setTesting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [timeZone, setTimeZone] = useState("");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
    try {
      setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setTimeZone("Asia/Dubai");
    }
  }, []);

  const runTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) setHealth(await res.json());
    } finally {
      setTesting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const supabase = createClient();
      const out: Record<string, unknown[]> = {};
      for (const t of EXPORT_TABLES) {
        const { data } = await supabase.from(t).select("*").is("deleted_at", null).limit(10000);
        out[t] = data ?? [];
      }
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...out }, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `kaka-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("লগআউট করবে?")) return;
    await createClient().auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface/30 pb-20 md:pb-8">
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">সেটিংস</h1>
          <p className="text-xs md:text-sm text-muted">অ্যাকাউন্ট, সংযোগ আর তোমার ডেটা</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Section icon={User} title="অ্যাকাউন্ট" subtitle="যে অ্যাকাউন্টে লগইন করা আছে">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground font-mono">{email ?? "..."}</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-danger hover:bg-red-50 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" /> লগআউট
            </button>
          </div>
        </Section>

        <Section
          icon={Cpu}
          title="সংযোগ পরীক্ষা"
          subtitle="ডাটাবেজ (Supabase) আর AI (Gemini) সত্যিই কাজ করছে কিনা দেখো"
          right={
            <button
              onClick={runTest}
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-hover text-sm font-medium disabled:opacity-60"
            >
              <RefreshCw className={cn("w-4 h-4", testing && "animate-spin")} />
              {testing ? "পরীক্ষা চলছে..." : "পরীক্ষা করো"}
            </button>
          }
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-foreground">
                <Database className="w-4 h-4 text-muted" /> Supabase ডাটাবেজ
              </span>
              <StatusPill
                ok={health ? health.database.ok : null}
                label={health ? (health.database.ok ? `ঠিক আছে · ${health.database.messageCount}টি মেসেজ` : "সমস্যা") : "পরীক্ষা হয়নি"}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-foreground">
                <Cpu className="w-4 h-4 text-muted" /> Gemini AI
              </span>
              <StatusPill
                ok={health ? health.gemini.ok : null}
                label={
                  health
                    ? health.gemini.ok
                      ? `${health.gemini.model} · ${health.gemini.latencyMs}ms`
                      : "সমস্যা"
                    : "পরীক্ষা হয়নি"
                }
              />
            </div>
            {health && !health.gemini.ok && health.gemini.error && (
              <p className="text-xs text-danger bg-red-50 border border-red-200 rounded-lg p-3 font-mono break-all">
                {health.gemini.error}
              </p>
            )}
            {health && !health.database.ok && health.database.error && (
              <p className="text-xs text-danger bg-red-50 border border-red-200 rounded-lg p-3 font-mono break-all">
                {health.database.error}
              </p>
            )}
            {health && (
              <p className="text-xs text-muted">
                মডেল: {health.models.primary} (ব্যাকআপ: {health.models.fallback}) — বদলাতে .env.local-এ GEMINI_MODEL
                সেট করো।
              </p>
            )}
          </div>
        </Section>

        <Section icon={Globe} title="অঞ্চল" subtitle="সময় হিসাবের জন্য ফোন/ব্রাউজারের টাইমজোন ব্যবহার হয়">
          <p className="text-sm text-foreground">
            টাইমজোন: <span className="font-mono">{timeZone || "..."}</span> · ডিফল্ট মুদ্রা: AED
          </p>
        </Section>

        <Section icon={Download} title="ডেটা এক্সপোর্ট" subtitle="তোমার সব তথ্য একটা JSON ফাইলে ডাউনলোড করো">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-surface text-sm font-medium disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {exporting ? "তৈরি হচ্ছে..." : "JSON ডাউনলোড"}
          </button>
        </Section>
      </div>
    </div>
  );
}
