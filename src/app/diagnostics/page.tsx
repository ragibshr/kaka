"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Info,
  X,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLogEntries,
  clearLogEntries,
  logApiCall,
  type LogEntry,
} from "@/lib/logger";

export default function DiagnosticsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedModal, setCopiedModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load log entries
  const refreshLogs = () => {
    setIsRefreshing(true);
    setLogs(getLogEntries());
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  // Copy all logs to clipboard as JSON
  const handleCopyAll = async () => {
    if (logs.length === 0) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      alert("লগ কপি করতে ব্যর্থ হয়েছে");
    }
  };

  // Clear all logs
  const handleClear = () => {
    if (logs.length === 0) return;
    if (confirm("আপনি কি সব ডায়াগনস্টিক লগ মুছে ফেলতে চান?")) {
      clearLogEntries();
      setLogs([]);
      setSelectedLog(null);
    }
  };

  // Copy single log in modal
  const handleCopySingle = async (entry: LogEntry) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
      setCopiedModal(true);
      setTimeout(() => setCopiedModal(false), 2000);
    } catch {
      alert("লগ কপি করতে ব্যর্থ হয়েছে");
    }
  };

  // Insert mock logs for easy preview if empty
  const handleAddSampleLogs = () => {
    logApiCall({
      provider: "groq",
      endpoint: "/api/chat/completions",
      status: 200,
      latencyMs: 145,
      error: null,
    });
    logApiCall({
      provider: "gemini",
      endpoint: "/v1beta/models/gemini-1.5-flash:generateContent",
      status: 429,
      latencyMs: 820,
      error: "Rate limit exceeded (RESOURCE_EXHAUSTED): quota reached for free tier",
    });
    logApiCall({
      provider: "openrouter",
      endpoint: "/api/v1/chat/completions",
      status: 200,
      latencyMs: 412,
      error: null,
    });
    logApiCall({
      provider: "supabase",
      endpoint: "/rest/v1/user_profiles?select=*",
      status: 500,
      latencyMs: 95,
      error: "PostgREST connection error: connection refused by database host",
    });
    refreshLogs();
  };

  // Formatter for timestamp
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("bn-BD", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  // Quick stats
  const totalCalls = logs.length;
  const successCalls = logs.filter((l) => l.status && l.status >= 200 && l.status < 300).length;
  const errorCalls = logs.filter((l) => !l.status || l.status >= 400 || l.error).length;
  const avgLatency =
    totalCalls > 0
      ? Math.round(logs.reduce((acc, l) => acc + l.latencyMs, 0) / totalCalls)
      : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-surface/30 pb-20 md:pb-6">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border px-4 py-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-light text-accent flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                ডায়াগনস্টিকস
              </h1>
              <p className="text-xs md:text-sm text-muted">
                সর্বশেষ ৫০টি এপিআই কল ও সিস্টেম রিকোয়েস্ট লগ
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={refreshLogs}
              title="রিফ্রেশ"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface hover:bg-surface-2 text-foreground text-xs font-medium transition-theme"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")}
              />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>

            <button
              onClick={handleCopyAll}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-surface hover:bg-surface-2 text-foreground text-xs font-medium transition-theme disabled:opacity-50"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span className="text-success">কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>সব কপি করো</span>
                </>
              )}
            </button>

            <button
              onClick={handleClear}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-danger text-xs font-medium transition-theme disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ক্লিয়ার</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        {/* Stats summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-white border border-border rounded-xl shadow-xs">
            <p className="text-xs text-muted">মোট রিকোয়েস্ট</p>
            <p className="text-xl font-bold text-foreground mt-1">{totalCalls}</p>
          </div>
          <div className="p-4 bg-white border border-border rounded-xl shadow-xs">
            <p className="text-xs text-success flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> সফল কল
            </p>
            <p className="text-xl font-bold text-success mt-1">{successCalls}</p>
          </div>
          <div className="p-4 bg-white border border-border rounded-xl shadow-xs">
            <p className="text-xs text-danger flex items-center gap-1">
              <XCircle className="w-3 h-3" /> ত্রুটি
            </p>
            <p className="text-xl font-bold text-danger mt-1">{errorCalls}</p>
          </div>
          <div className="p-4 bg-white border border-border rounded-xl shadow-xs">
            <p className="text-xs text-muted flex items-center gap-1">
              <Zap className="w-3 h-3 text-warning" /> গড় লেটেন্সি
            </p>
            <p className="text-xl font-bold text-foreground mt-1">
              {avgLatency} <span className="text-xs font-normal text-muted">ms</span>
            </p>
          </div>
        </div>

        {/* Logs Table / Empty state */}
        {logs.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-accent-light text-accent mx-auto flex items-center justify-center mb-4">
              <Activity className="w-7 h-7" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-foreground mb-1">
              কোনো ডায়াগনস্টিক লগ পাওয়া যায়নি
            </h3>
            <p className="text-xs md:text-sm text-muted max-w-md mx-auto mb-6">
              এখনো কোনো API রিকোয়েস্ট করা হয়নি। চ্যাট বার্তা পাঠালে বা সেটিংস টেস্ট করলে রিয়েল-টাইম লগ এখানে জমা হবে।
            </p>
            <button
              onClick={handleAddSampleLogs}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover text-xs font-medium transition-theme shadow-sm"
            >
              <Zap className="w-4 h-4" />
              <span>নমুনা টেস্ট লগ তৈরি করো (Sample Logs)</span>
            </button>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface/30">
              <span className="text-xs font-medium text-foreground">
                লগ তালিকা (মোট {logs.length}টি এন্ট্রি)
              </span>
              <span className="text-[11px] text-muted">
                বিস্তারিত দেখতে সারির উপরে ক্লিক করো
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface text-muted font-medium border-b border-border">
                  <tr>
                    <th className="py-3 px-4">সময় (Time)</th>
                    <th className="py-3 px-4">প্রোভাইডার</th>
                    <th className="py-3 px-4">এন্ডপয়েন্ট</th>
                    <th className="py-3 px-4">স্ট্যাটাস</th>
                    <th className="py-3 px-4">লেটেন্সি</th>
                    <th className="py-3 px-4">ত্রুটি (Error)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log, index) => {
                    const isSuccess = log.status && log.status >= 200 && log.status < 300;
                    const isRateLimit = log.status === 429;
                    const isError = !log.status || log.status >= 400 || log.error;

                    return (
                      <tr
                        key={index}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-accent-light/30 cursor-pointer transition-colors"
                      >
                        {/* Time */}
                        <td className="py-3 px-4 whitespace-nowrap text-muted font-mono">
                          {formatTime(log.timestamp)}
                        </td>

                        {/* Provider */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-md text-[11px] font-medium uppercase font-mono",
                              log.provider === "groq" && "bg-orange-50 text-orange-700 border border-orange-200",
                              log.provider === "gemini" && "bg-blue-50 text-blue-700 border border-blue-200",
                              log.provider === "openrouter" && "bg-purple-50 text-purple-700 border border-purple-200",
                              log.provider === "supabase" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                              !["groq", "gemini", "openrouter", "supabase"].includes(log.provider) &&
                                "bg-surface text-foreground border border-border"
                            )}
                          >
                            {log.provider}
                          </span>
                        </td>

                        {/* Endpoint */}
                        <td className="py-3 px-4 font-mono text-[11px] text-foreground max-w-[200px] truncate" title={log.endpoint}>
                          {log.endpoint}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1",
                              isSuccess && "bg-emerald-50 text-success border border-emerald-200",
                              isRateLimit && "bg-amber-50 text-warning border border-amber-200",
                              isError && !isRateLimit && "bg-red-50 text-danger border border-red-200",
                              !isSuccess && !isError && "bg-surface text-muted border border-border"
                            )}
                          >
                            {isSuccess && <CheckCircle2 className="w-3 h-3" />}
                            {isError && <AlertCircle className="w-3 h-3" />}
                            {log.status ?? "ERR"}
                          </span>
                        </td>

                        {/* Latency */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-muted">
                          <span
                            className={cn(
                              log.latencyMs > 1000
                                ? "text-warning font-semibold"
                                : log.latencyMs > 2500
                                ? "text-danger font-semibold"
                                : "text-muted"
                            )}
                          >
                            {log.latencyMs} ms
                          </span>
                        </td>

                        {/* Error preview */}
                        <td className="py-3 px-4 max-w-[220px]">
                          {log.error ? (
                            <span className="text-danger truncate block font-mono text-[11px]" title={log.error}>
                              {log.error}
                            </span>
                          ) : (
                            <span className="text-muted/60">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-border rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                <h3 className="font-semibold text-foreground text-sm">
                  লগ বিবরণ (Log Details)
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-muted block text-[10px]">সময় (Timestamp)</span>
                  <span className="font-mono text-foreground font-medium">
                    {new Date(selectedLog.timestamp).toLocaleString("bn-BD")}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-muted block text-[10px]">প্রোভাইডার</span>
                  <span className="font-semibold text-accent uppercase">
                    {selectedLog.provider}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-muted block text-[10px]">এইচটিটিপি স্ট্যাটাস</span>
                  <span
                    className={cn(
                      "font-bold",
                      selectedLog.status && selectedLog.status < 300
                        ? "text-success"
                        : "text-danger"
                    )}
                  >
                    {selectedLog.status ?? "N/A"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-border">
                  <span className="text-muted block text-[10px]">বিলম্ব (Latency)</span>
                  <span className="font-mono text-foreground font-medium">
                    {selectedLog.latencyMs} ms
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  রিকোয়েস্ট এন্ডপয়েন্ট (Endpoint)
                </label>
                <div className="p-2.5 rounded-xl bg-surface border border-border font-mono text-xs text-foreground break-all">
                  {selectedLog.endpoint}
                </div>
              </div>

              {selectedLog.error && (
                <div>
                  <label className="block text-xs font-medium text-danger mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    ত্রুটির বিবরণ (Error Message)
                  </label>
                  <pre className="p-3 rounded-xl bg-red-50 border border-red-200 text-danger text-xs font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                    {selectedLog.error}
                  </pre>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  র' JSON পেলোড (Raw Log Data)
                </label>
                <pre className="p-3 rounded-xl bg-surface text-foreground text-[11px] font-mono whitespace-pre-wrap border border-border max-h-36 overflow-y-auto">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-surface/30 flex items-center justify-end gap-2">
              <button
                onClick={() => handleCopySingle(selectedLog)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white hover:bg-surface text-xs font-medium text-foreground transition-theme"
              >
                {copiedModal ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-success" />
                    <span className="text-success">কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>JSON কপি করো</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-hover text-xs font-medium transition-theme"
              >
                বন্ধ করো
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
