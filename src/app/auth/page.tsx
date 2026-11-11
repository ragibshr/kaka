"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasSupabaseConfig, setHasSupabaseConfig] = useState<boolean | null>(null);

  // Check if Supabase credentials are configured in localStorage or environment
  useEffect(() => {
    try {
      const localUrl = localStorage.getItem("kaka_supabase_url");
      const localKey = localStorage.getItem("kaka_supabase_anon_key");
      const hasConfig = Boolean(
        (localUrl && localKey) ||
          (process.env.NEXT_PUBLIC_SUPABASE_URL &&
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      );
      setHasSupabaseConfig(hasConfig);
    } catch {
      setHasSupabaseConfig(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setErrorMessage("ইমেইল এবং পাসওয়ার্ড দুটিই প্রয়োজন।");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setErrorMessage("দয়া করে একটি সঠিক ইমেইল ঠিকানা দিন।");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setErrorMessage("উভয় পাসওয়ার্ড একই হতে হবে।");
      return;
    }

    setIsLoading(true);

    // TODO: Supabase auth integration
    // e.g.:
    // if (mode === 'login') {
    //   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // } else {
    //   const { data, error } = await supabase.auth.signUp({ email, password });
    // }
    console.log(`[Auth Submit] Mode: ${mode}, Email: ${email}`);
    console.log(
      "// TODO: Supabase auth integration — connect supabase.auth.signInWithPassword or signUp"
    );

    setTimeout(() => {
      setIsLoading(false);
      if (mode === "signup") {
        setSuccessMessage(
          "অ্যাকাউন্ট সফলভাবে প্রস্তুত করা হয়েছে! (ডেমো মোড — Supabase integration pending)"
        );
      } else {
        setSuccessMessage(
          "লগইন সফল হয়েছে! কাকা তে স্বাগতম। (ডেমো মোড — Supabase integration pending)"
        );
      }
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[calc(100vh-64px)] bg-surface/30 pb-20 md:pb-6">
      <div className="w-full max-w-md space-y-6">
        {/* Supabase Missing Warning Card */}
        {hasSupabaseConfig === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-warning flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900">
                  Supabase সেটআপ বাকি
                </h3>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  লাইভ অথেনটিকেশন ও ক্লাউড সিঙ্কের জন্য Supabase URL ও কী প্রয়োজন। Settings পেজ থেকে সহজে সেটআপ করো।
                </p>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline mt-2.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Settings এ যাও &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Auth Card */}
        <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Logo & Brand Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-white font-bold text-2xl shadow-md mb-3">
              <span>K</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Kaka</h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              {mode === "login"
                ? "তোমার অ্যাকাউন্টে লগইন করো"
                : "নতুন একটি কাকা অ্যাকাউন্ট তৈরি করো"}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-surface rounded-xl border border-border mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={cn(
                "py-2 text-xs sm:text-sm font-semibold rounded-lg transition-theme",
                mode === "login"
                  ? "bg-white text-accent shadow-xs"
                  : "text-muted hover:text-foreground"
              )}
            >
              লগইন
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={cn(
                "py-2 text-xs sm:text-sm font-semibold rounded-lg transition-theme",
                mode === "signup"
                  ? "bg-white text-accent shadow-xs"
                  : "text-muted hover:text-foreground"
              )}
            >
              সাইন আপ
            </button>
          </div>

          {/* Error & Success Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-danger text-xs flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-success text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                ইমেইল ঠিকানা (Email)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-surface/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-theme"
                />
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">
                পাসওয়ার্ড (Password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-surface/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-theme"
                />
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1"
                  title={showPassword ? "পাসওয়ার্ড আড়াল করো" : "পাসওয়ার্ড দেখাও"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password for Sign Up */}
            {mode === "signup" && (
              <div className="animate-in fade-in">
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  পাসওয়ার্ড নিশ্চিত করো (Confirm Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-border bg-surface/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-theme"
                  />
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-accent text-white hover:bg-accent-hover text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-theme disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === "login" ? "লগইন করুন" : "অ্যাকাউন্ট তৈরি করুন"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between login / signup link */}
          <div className="mt-6 pt-5 border-t border-border text-center">
            {mode === "login" ? (
              <p className="text-xs text-muted">
                অ্যাকাউন্ট নেই?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-semibold text-accent hover:underline"
                >
                  নতুন অ্যাকাউন্ট তৈরি করো
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-semibold text-accent hover:underline"
                >
                  লগইন করো
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Guest info badge */}
        <div className="text-center">
          <p className="text-xs text-muted flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>লগইন ছাড়াও ব্রাউজারে কাকার লোকাল স্টোরেজ ব্যবহার করা যাবে</span>
          </p>
        </div>
      </div>
    </div>
  );
}
