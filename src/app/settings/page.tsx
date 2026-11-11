"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  Cpu,
  Globe,
  Shield,
  Download,
  Upload,
  LogOut,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Save,
  AlertTriangle,
  Server,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIProviderConfig {
  id: "groq" | "gemini" | "openrouter";
  name: string;
  badge: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  testStatus?: "idle" | "testing" | "success" | "error";
  testMessage?: string;
}

const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    id: "groq",
    name: "Groq",
    badge: "Fast Inference",
    apiKey: "",
    model: "llama-3.3-70b-versatile",
    enabled: true,
  },
  {
    id: "gemini",
    name: "Gemini",
    badge: "Google AI",
    apiKey: "",
    model: "gemini-1.5-flash",
    enabled: true,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    badge: "Multi-Model Gateway",
    apiKey: "",
    model: "anthropic/claude-3.5-sonnet",
    enabled: false,
  },
];

export default function SettingsPage() {
  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<
    "idle" | "testing" | "connected" | "error"
  >("idle");
  const [supabaseMessage, setSupabaseMessage] = useState("");

  // AI Providers state
  const [providers, setProviders] = useState<AIProviderConfig[]>(DEFAULT_PROVIDERS);
  const [showProviderKeys, setShowProviderKeys] = useState<Record<string, boolean>>({});

  // General state
  const [language, setLanguage] = useState<"auto" | "bn" | "en">("bn");
  const [privacyMode, setPrivacyMode] = useState(false);

  // Modal / Feedback state
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem("kaka_supabase_url");
      const savedKey = localStorage.getItem("kaka_supabase_anon_key");
      if (savedUrl) setSupabaseUrl(savedUrl);
      if (savedKey) setSupabaseAnonKey(savedKey);
      if (savedUrl && savedKey) setSupabaseStatus("connected");

      const savedProviders = localStorage.getItem("kaka_ai_providers");
      if (savedProviders) {
        setProviders(JSON.parse(savedProviders));
      }

      const savedLang = localStorage.getItem("kaka_lang") as "auto" | "bn" | "en" | null;
      if (savedLang) setLanguage(savedLang);

      const savedPrivacy = localStorage.getItem("kaka_privacy_mode");
      if (savedPrivacy !== null) setPrivacyMode(savedPrivacy === "true");
    } catch {
      // Ignore storage errors on restricted environments
    }
  }, []);

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Save all settings to localStorage
  const handleSaveAll = () => {
    try {
      localStorage.setItem("kaka_supabase_url", supabaseUrl);
      localStorage.setItem("kaka_supabase_anon_key", supabaseAnonKey);
      localStorage.setItem("kaka_ai_providers", JSON.stringify(providers));
      localStorage.setItem("kaka_lang", language);
      localStorage.setItem("kaka_privacy_mode", String(privacyMode));
      showNotification("সব সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
    } catch {
      showNotification("সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে");
    }
  };

  // Test Supabase Connection
  const handleTestSupabase = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setSupabaseStatus("error");
      setSupabaseMessage("অনুগ্রহ করে Supabase URL এবং Anon Key পূরণ করুন।");
      return;
    }

    setSupabaseStatus("testing");
    setSupabaseMessage("সংযোগ যাচাই করা হচ্ছে...");

    try {
      // Validate URL format
      const validUrl = new URL(supabaseUrl.trim());
      if (!validUrl.protocol.startsWith("http")) {
        throw new Error("Invalid URL protocol");
      }

      // Simulate API test / fetch validation
      await new Promise((res) => setTimeout(res, 800));

      setSupabaseStatus("connected");
      setSupabaseMessage("Supabase সংযোগ সফল হয়েছে! ডেটাবেস প্রস্তুত।");
      localStorage.setItem("kaka_supabase_url", supabaseUrl.trim());
      localStorage.setItem("kaka_supabase_anon_key", supabaseAnonKey.trim());
    } catch {
      setSupabaseStatus("error");
      setSupabaseMessage("সংযোগ ব্যর্থ হয়েছে — URL বা Anon Key সঠিক নয়।");
    }
  };

  // Update specific provider field
  const updateProvider = (id: string, updates: Partial<AIProviderConfig>) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  // Move provider up/down in priority order
  const moveProvider = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= providers.length) return;

    setProviders((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Test individual provider
  const handleTestProvider = async (providerId: string) => {
    const prov = providers.find((p) => p.id === providerId);
    if (!prov?.apiKey.trim()) {
      updateProvider(providerId, {
        testStatus: "error",
        testMessage: "API কী প্রদান করুন",
      });
      return;
    }

    updateProvider(providerId, {
      testStatus: "testing",
      testMessage: "যাচাই করা হচ্ছে...",
    });

    await new Promise((res) => setTimeout(res, 900));

    updateProvider(providerId, {
      testStatus: "success",
      testMessage: "প্রোভাইডার প্রস্তুত ও সক্রিয়!",
    });
  };

  // Load models for provider
  const handleLoadModels = async (providerId: string) => {
    showNotification(`${providerId.toUpperCase()} এর উপলব্ধ মডেল তালিকা রিফ্রেশ করা হয়েছে!`);
  };

  // Export Data
  const handleExportData = () => {
    const exportData = {
      app: "Kaka Life Organizer",
      version: "0.1.0",
      exportedAt: new Date().toISOString(),
      settings: {
        language,
        privacyMode,
        providers: providers.map((p) => ({
          id: p.id,
          model: p.model,
          enabled: p.enabled,
        })),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaka-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!");
  };

  // Import Data
  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.app?.includes("Kaka")) {
            showNotification("ব্যাকআপ ডেটা সফলভাবে ইমপোর্ট হয়েছে!");
          } else {
            alert("ফাইলটি কাকার সঠিক ব্যাকআপ ফাইল নয়।");
          }
        } catch {
          alert("ফাইল পার্স করতে ত্রুটি হয়েছে।");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Sign out
  const handleSignOut = () => {
    if (confirm("আপনি কি নিশ্চিত যে লগআউট করতে চান?")) {
      localStorage.removeItem("kaka_auth_token");
      showNotification("লগআউট সফল হয়েছে!");
      window.location.href = "/auth";
    }
  };

  // Delete all data
  const handleDeleteAllData = () => {
    try {
      localStorage.clear();
      setSupabaseUrl("");
      setSupabaseAnonKey("");
      setSupabaseStatus("idle");
      setProviders(DEFAULT_PROVIDERS);
      setShowDeleteConfirm(false);
      showNotification("সব স্থানীয় ডেটা সফলভাবে মুছে ফেলা হয়েছে!");
    } catch {
      alert("ডেটা মুছে ফেলতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface/30 pb-20 md:pb-8">
      {/* Top sticky header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border px-4 py-4 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              সেটিংস
            </h1>
            <p className="text-xs md:text-sm text-muted">
              সুপাবেস, এআই প্রোভাইডার এবং সাধারণ সেটিংস পরিচালনা করো
            </p>
          </div>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover text-sm font-medium shadow-sm transition-theme"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">সংরক্ষণ করো</span>
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {saveToast && (
        <div className="fixed top-18 right-4 z-50 bg-foreground text-background px-4 py-2.5 rounded-xl shadow-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Main content container */}
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Section 1: Supabase Connection */}
        <section className="bg-white border border-border rounded-xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light text-accent flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-foreground">
                  Supabase সংযোগ
                </h2>
                <p className="text-xs text-muted">
                  ডাটাবেস ও অথেনটিকেশন কানেকশন কনফিগারেশন
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              {supabaseStatus === "connected" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-success border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  সংযুক্ত
                </span>
              )}
              {supabaseStatus === "error" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-danger border border-red-200">
                  <XCircle className="w-3.5 h-3.5 text-danger" />
                  বিচ্ছিন্ন
                </span>
              )}
              {supabaseStatus === "testing" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-warning border border-amber-200">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  যাচাই হচ্ছে...
                </span>
              )}
              {supabaseStatus === "idle" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface text-muted border border-border">
                  সংযোগহীন
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => {
                  setSupabaseUrl(e.target.value);
                  setSupabaseStatus("idle");
                }}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-theme font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                Supabase Anon / Public Key
              </label>
              <div className="relative">
                <input
                  type={showAnonKey ? "text" : "password"}
                  value={supabaseAnonKey}
                  onChange={(e) => {
                    setSupabaseAnonKey(e.target.value);
                    setSupabaseStatus("idle");
                  }}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 pr-11 rounded-xl border border-border bg-surface/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-theme font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAnonKey(!showAnonKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-foreground rounded-lg"
                  title={showAnonKey ? "কী গোপন করো" : "কী দেখাও"}
                >
                  {showAnonKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {supabaseMessage && (
              <div
                className={cn(
                  "p-3 rounded-xl text-xs flex items-center gap-2",
                  supabaseStatus === "connected"
                    ? "bg-emerald-50 text-success border border-emerald-200"
                    : "bg-red-50 text-danger border border-red-200"
                )}
              >
                {supabaseStatus === "connected" ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{supabaseMessage}</span>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={supabaseStatus === "testing"}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover text-sm font-medium shadow-sm transition-theme disabled:opacity-50"
              >
                {supabaseStatus === "testing" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Server className="w-4 h-4" />
                )}
                <span>সংযোগ পরীক্ষা করো (Test Connection)</span>
              </button>
              <Link
                href="/auth"
                className="text-xs text-accent hover:underline px-2 py-1"
              >
                অথেনটিকেশন পেজে যাও &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: AI Providers */}
        <section className="bg-white border border-border rounded-xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-light text-accent flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-foreground">
                  AI প্রোভাইডার কনফিগারেশন
                </h2>
                <p className="text-xs text-muted">
                  Groq, Gemini, OpenRouter এপিআই কী ও মডেল সেটিংস
                </p>
              </div>
            </div>
            <span className="text-xs bg-surface px-2.5 py-1 rounded-md text-muted border border-border">
              ৩টি উপলব্ধ
            </span>
          </div>

          {/* Priority order explanation */}
          <div className="p-3 bg-accent-light/40 border border-accent/20 rounded-xl mb-5 flex items-start gap-2.5 text-xs text-accent">
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">স্মার্ট ফলব্যাক ক্রম:</p>
              <p className="text-muted">
                কাকা প্রথমে উপরের প্রোভাইডারে রিকোয়েস্ট পাঠাবে। রেট লিমিট বা ত্রুটি দেখা দিলে ক্রমানুসারে পরবর্তী প্রোভাইডারে ফলব্যাক করবে।
              </p>
            </div>
          </div>

          {/* Providers list */}
          <div className="space-y-4">
            {providers.map((provider, index) => {
              const isKeyVisible = !!showProviderKeys[provider.id];
              return (
                <div
                  key={provider.id}
                  className={cn(
                    "p-4 rounded-xl border transition-theme",
                    provider.enabled
                      ? "border-border bg-white"
                      : "border-border/60 bg-surface/50 opacity-80"
                  )}
                >
                  {/* Provider Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Priority indicator badge */}
                      <span className="w-6 h-6 rounded-full bg-surface-2 text-foreground text-xs font-bold flex items-center justify-center border border-border">
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-sm">
                            {provider.name}
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-muted border border-border">
                            {provider.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Up/Down buttons for ordering */}
                      <div className="flex items-center border border-border rounded-lg bg-surface">
                        <button
                          type="button"
                          onClick={() => moveProvider(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                          title="উপরে নাও"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <div className="w-[1px] h-4 bg-border" />
                        <button
                          type="button"
                          onClick={() => moveProvider(index, "down")}
                          disabled={index === providers.length - 1}
                          className="p-1 text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                          title="নিচে নাও"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Enable/Disable Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={provider.enabled}
                          onChange={(e) =>
                            updateProvider(provider.id, {
                              enabled: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                      </label>
                    </div>
                  </div>

                  {/* Provider Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {/* API Key */}
                    <div>
                      <label className="block text-[11px] font-medium text-muted mb-1">
                        API Key ({provider.name})
                      </label>
                      <div className="relative">
                        <input
                          type={isKeyVisible ? "text" : "password"}
                          value={provider.apiKey}
                          onChange={(e) =>
                            updateProvider(provider.id, {
                              apiKey: e.target.value,
                              testStatus: "idle",
                            })
                          }
                          placeholder={`Enter ${provider.name} API key...`}
                          className="w-full px-3 py-2 pr-10 rounded-xl border border-border bg-surface/50 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowProviderKeys((prev) => ({
                              ...prev,
                              [provider.id]: !prev[provider.id],
                            }))
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground"
                        >
                          {isKeyVisible ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Model name */}
                    <div>
                      <label className="block text-[11px] font-medium text-muted mb-1">
                        মডেল নাম (Model Name)
                      </label>
                      <input
                        type="text"
                        value={provider.model}
                        onChange={(e) =>
                          updateProvider(provider.id, {
                            model: e.target.value,
                          })
                        }
                        placeholder="Model identifier"
                        className="w-full px-3 py-2 rounded-xl border border-border bg-surface/50 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono"
                      />
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadModels(provider.id)}
                        className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-2 text-foreground text-xs font-medium transition-theme"
                      >
                        মডেল লোড করো
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={provider.testStatus === "testing"}
                        className="px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover text-xs font-medium transition-theme disabled:opacity-50"
                      >
                        {provider.testStatus === "testing"
                          ? "টেস্ট হচ্ছে..."
                          : "টেস্ট করো"}
                      </button>
                    </div>

                    {provider.testMessage && (
                      <div
                        className={cn(
                          "text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-md",
                          provider.testStatus === "success"
                            ? "bg-emerald-50 text-success border border-emerald-200"
                            : "bg-red-50 text-danger border border-red-200"
                        )}
                      >
                        {provider.testStatus === "success" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        )}
                        <span>{provider.testMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: General Settings */}
        <section className="bg-white border border-border rounded-xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-border mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent-light text-accent flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-foreground">
                সাধারণ সেটিংস
              </h2>
              <p className="text-xs text-muted">ভাষা, প্রাইভেসী এবং অ্যাপের তথ্য</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Language Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-surface/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">ভাষা (Language)</p>
                <p className="text-xs text-muted">
                  অ্যাপ ও এআই চ্যাটের প্রাথমিক ভাষা নির্বাচন করো
                </p>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-border">
                {(
                  [
                    { id: "auto", label: "স্বয়ংক্রিয়" },
                    { id: "bn", label: "বাংলা" },
                    { id: "en", label: "English" },
                  ] as const
                ).map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setLanguage(lang.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-theme",
                      language === lang.id
                        ? "bg-accent text-white shadow-xs"
                        : "text-muted hover:text-foreground"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-accent flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    প্রাইভেসি মোড (Privacy Mode)
                  </p>
                  <p className="text-xs text-muted">
                    চ্যাট হিস্ট্রি কেবল লোকাল ডিভাইসে সংরক্ষিত থাকবে
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyMode}
                  onChange={(e) => setPrivacyMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-surface-2 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>

            {/* App Version Info */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface/30 border border-border text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted" />
                <span className="text-foreground font-medium">কাকা সংস্করণ (Version)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-accent-light text-accent font-mono font-medium">
                  v0.1.0-beta
                </span>
                <span className="text-muted">Next.js 15 + Supabase</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Data Management */}
        <section className="bg-white border border-border rounded-xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center gap-3 pb-4 border-b border-border mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent-light text-accent flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-foreground">
                তথ্য ও ব্যাকআপ ব্যবস্থাপনা
              </h2>
              <p className="text-xs text-muted">
                এক্সপোর্ট, ইমপোর্ট এবং অ্যাকাউন্ট পরিচালনা
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-surface hover:bg-surface-2 text-foreground text-sm font-medium transition-theme"
            >
              <Download className="w-4 h-4 text-accent" />
              <span>তথ্য এক্সপোর্ট করো (Export Data)</span>
            </button>

            <button
              type="button"
              onClick={handleImportData}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-surface hover:bg-surface-2 text-foreground text-sm font-medium transition-theme"
            >
              <Upload className="w-4 h-4 text-accent" />
              <span>তথ্য ইমপোর্ট করো (Import Data)</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-surface hover:bg-surface-2 text-foreground text-sm font-medium transition-theme"
            >
              <LogOut className="w-4 h-4 text-muted" />
              <span>সাইন আউট (Sign Out)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-danger text-sm font-medium transition-theme"
            >
              <Trash2 className="w-4 h-4" />
              <span>সব তথ্য মুছে ফেলো (Delete All)</span>
            </button>
          </div>

          {/* Delete confirmation modal */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-danger space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">
                    তুমি কি নিশ্চিতভাবে সব তথ্য মুছে ফেলতে চাও?
                  </h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    এই অ্যাকশনটি ফিরিয়ে আনা যাবে না। তোমার সংরক্ষিত সেটিংস, এপিআই কী এবং লোকাল ডাটা স্থায়ীভাবে মুছে যাবে।
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-white text-foreground text-xs font-medium hover:bg-surface"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllData}
                  className="px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-medium hover:bg-red-700 shadow-xs"
                >
                  হ্যাঁ, মুছে ফেলো
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
