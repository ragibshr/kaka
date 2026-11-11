"use client";

import React, { Component, useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertOctagon, Copy, Check, RotateCw, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorFallbackProps {
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
  resetErrorBoundary?: () => void;
}

export function ErrorFallback({
  error,
  errorInfo,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  const [copied, setCopied] = useState(false);

  const errorMessage = error?.message || "অপ্রত্যাশিত কোনো ত্রুটি ঘটেছে।";
  const errorDetails = error?.stack || errorInfo?.componentStack || "";

  const handleCopyError = async () => {
    try {
      const fullErrorText = `Error: ${errorMessage}\n\nStack:\n${errorDetails}`;
      await navigator.clipboard.writeText(fullErrorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("ত্রুটি কপি করতে ব্যর্থ হয়েছে");
    }
  };

  const handleReload = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 pb-20 md:pb-6">
      <div className="w-full max-w-lg bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-sm text-center">
        {/* Kaka's blue 'K' avatar */}
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white font-bold text-3xl shadow-lg ring-4 ring-accent-light mx-auto mb-4">
          <span>K</span>
        </div>

        {/* Bengali Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          কিছু একটা সমস্যা হয়েছে
        </h2>
        <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto mb-6">
          কাকা এই পেজটি লোড করার সময় একটি অপ্রত্যাশিত সমস্যার মুখোমুখি হয়েছে। তোমার তথ্য সুরক্ষিত আছে।
        </p>

        {/* Error Code Block */}
        <div className="text-left mb-6">
          <div className="flex items-center justify-between text-xs text-muted mb-1.5 px-1">
            <span className="font-medium flex items-center gap-1 text-danger">
              <AlertOctagon className="w-3.5 h-3.5" />
              ত্রুটির বিবরণ (Error Log)
            </span>
            <span className="text-[11px] font-mono">React Error Boundary</span>
          </div>

          <div className="relative rounded-xl bg-surface border border-border overflow-hidden">
            <pre className="p-3.5 text-xs font-mono text-danger overflow-x-auto max-h-44 text-left leading-relaxed whitespace-pre-wrap break-all">
              {errorMessage}
              {errorDetails && (
                <span className="block mt-2 text-[11px] text-muted font-mono opacity-80">
                  {errorDetails}
                </span>
              )}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Copy error button */}
          <button
            type="button"
            onClick={handleCopyError}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface hover:bg-surface-2 text-foreground text-xs sm:text-sm font-medium transition-theme"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-success" />
                <span className="text-success">কপি করা হয়েছে!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-muted" />
                <span>ত্রুটি কপি করো</span>
              </>
            )}
          </button>

          {/* Restart / Retry button */}
          <button
            type="button"
            onClick={handleReload}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover text-xs sm:text-sm font-semibold shadow-sm transition-theme"
          >
            <RotateCw className="w-4 h-4" />
            <span>আবার চেষ্টা করো</span>
          </button>
        </div>

        {/* Home link */}
        <div className="mt-6 pt-4 border-t border-border">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-theme"
          >
            <Home className="w-3.5 h-3.5" />
            <span>মূল চ্যাট পেজে ফিরে যাও</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // Log to console for dev tracking
    console.error("[ErrorBoundary caught an unhandled error]:", error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetErrorBoundary: this.resetErrorBoundary,
        });
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
