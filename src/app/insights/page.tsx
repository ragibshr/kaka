"use client";

import { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Flame,
  Brain,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TimeRange = "weekly" | "monthly";

interface HabitItem {
  id: string;
  title: string;
  description: string;
  streakCount?: string;
  impact: "high" | "medium";
}

interface TrendItem {
  id: string;
  metric: string;
  change: string;
  isPositive: boolean;
  explanation: string;
}

interface SuggestionItem {
  id: string;
  title: string;
  actionText: string;
  priority: "high" | "normal";
}

// TODO: Replace with real AI insight generation API route (e.g. /api/ai/insights)
const weeklyData = {
  summary:
    "গত সপ্তাহে তোমার সামগ্রিক উৎপাদনশীলতা সন্তোষজনক ছিল। কাজের সময় নিয়ন্ত্রণ ভালো থাকলেও সপ্তাহের মাঝামাঝি খাবারে অতিরিক্ত ব্যয় এবং ঘুমের অনিয়ম লক্ষ্য করা গেছে।",
  goodHabits: [
    {
      id: "gh1",
      title: "প্রতিদিন কাজের সময় ট্র্যাক করা",
      description: "টানা ৬ দিন সময়মতো পাঞ্চ-ইন এবং কাজের লগ সংরক্ষণ করেছ।",
      streakCount: "৬ দিন ধারাবাহিক",
      impact: "high",
    },
    {
      id: "gh2",
      title: "পর্যাপ্ত পানি পান",
      description: "গড়ে প্রতিদিন ৭-৮ গ্লাস পানি পান করার লক্ষ্য পূরণ হয়েছে।",
      streakCount: "৫ দিন পূর্ণ",
      impact: "medium",
    },
    {
      id: "gh3",
      title: "ক্যারিয়ার লক্ষ্য ও স্টাডি",
      description: "সপ্তাহে ৪ ঘণ্টা নতুন প্রযুক্তি ও কোর্স অনুশীলনে ব্যয় করেছ।",
      streakCount: "৪টি সেশন",
      impact: "high",
    },
  ] as HabitItem[],
  badHabits: [
    {
      id: "bh1",
      title: "দেরিতে ঘুমাতে যাওয়া",
      description: "গত সপ্তাহের ৩ দিন রাত ২টার পর ঘুমাতে গিয়েছ, যার ফলে পরের দিন সকালে ক্লান্তি ছিল।",
      streakCount: "৩ দিন অনিয়ম",
      impact: "high",
    },
    {
      id: "bh2",
      title: "বাইরের অতিরিক্ত ফাস্টফুড",
      description: "সপ্তাহে ৩ বার রেস্তোরাঁ থেকে খাবার অর্ডার করেছ, যা বাজেটের বাইরে চলে গেছে।",
      streakCount: "৳ ১,৪৫০ অতিরিক্ত ব্যয়",
      impact: "medium",
    },
  ] as HabitItem[],
  trends: [
    {
      id: "t1",
      metric: "কাজের আউটপুট ও ফোকাস",
      change: "+১৫%",
      isPositive: true,
      explanation: "গত সপ্তাহের চেয়ে দৈনিক কাজের ঘণ্টা ও সম্পন্ন কাজের সংখ্যা বেড়েছে।",
    },
    {
      id: "t2",
      metric: "খাবার ও রেস্তোরাঁ খরচ",
      change: "+২২%",
      isPositive: false,
      explanation: "গ্রোসারি কম করে রেস্তোরাঁয় বেশি খরচ হওয়ায় সামগ্রিক ব্যয় বৃদ্ধি পেয়েছে।",
    },
    {
      id: "t3",
      metric: "ব্যায়াম ও শারীরিক এক্টিভিটি",
      change: "-১০%",
      isPositive: false,
      explanation: "বৃষ্টি ও ব্যস্ততার কারণে হাঁটার গড় সময় কিছুটা কমে গেছে।",
    },
  ] as TrendItem[],
  suggestions: [
    {
      id: "sg1",
      title: "রাত ১২:৩০ এর মধ্যে ডিজিটাল পর্দা বন্ধ করো",
      actionText: "স্লিপ রুটিন অন করো এবং কাকা তোমাকে ১২:১৫ তে মনে করিয়ে দেবে।",
      priority: "high",
    },
    {
      id: "sg2",
      title: "সাপ্তাহিক লাঞ্চ বক্স প্ল্যানিং",
      actionText: "শুক্রবার বাজার করে রবি থেকে মঙ্গলবারের খাবারের প্রস্তুতি আগে নিয়ে রাখো।",
      priority: "normal",
    },
    {
      id: "sg3",
      title: "আর্থিক বাজেটের দৈনিক সীমা নির্ধারণ",
      actionText: "দৈনিক ৫০০ টাকার বেশি ব্যয়ের ক্ষেত্রে কাকার সতর্কবার্তা চালু রাখো।",
      priority: "normal",
    },
  ] as SuggestionItem[],
};

const monthlyData = {
  summary:
    "চলতি মাসে তুমি স্বাস্থ্য ও কেরিয়ারে যথেষ্ট অগ্রগতি করেছ। তবে মাসের প্রথম ১০ দিনে বাজেট ব্যালেন্স কিছুটা বিঘ্নিত হলেও পরবর্তী সপ্তাহগুলোতে সঞ্চয় বাড়ানোর প্রবণতা ইতিবাচক।",
  goodHabits: [
    {
      id: "mgh1",
      title: "নিয়মিত ধারদেনা পরিষ্কার রাখা",
      description: "বন্ধুদের সাথে লেনদেনের হিসাব সময়মতো পরিশোধ করায় বিশ্বাসের সম্পর্ক বজায় রয়েছে।",
      streakCount: "৩টি ঋণ পরিশোধিত",
      impact: "high",
    },
    {
      id: "mgh2",
      title: "নতুন স্কিল শেখার ধারাবাহিকতা",
      description: "মাসে মোট ১৮ ঘণ্টা টেকনিক্যাল স্কিল ডেভেলপমেন্টে নিয়োজিত ছিল।",
      streakCount: "৮০% কোর্স সমাপ্ত",
      impact: "high",
    },
  ] as HabitItem[],
  badHabits: [
    {
      id: "mbh1",
      title: "ছুটির দিনে রুটিনহীন অলস সময় কাটানো",
      description: "ছুটির দিনগুলোতে দীর্ঘক্ষণ স্ক্রিন টাইম লক্ষ্য করা গেছে।",
      streakCount: "গড় স্ক্রিনটাইম ৫.৫ ঘণ্টা",
      impact: "high",
    },
  ] as HabitItem[],
  trends: [
    {
      id: "mt1",
      metric: "মোট সঞ্চয় ও নেট স্থিতি",
      change: "+১৮%",
      isPositive: true,
      explanation: "ফ্রিল্যান্স আয় যুক্ত হওয়ায় চলতি মাসে নেট সঞ্চয় ভালো অবস্থানে আছে।",
    },
    {
      id: "mt2",
      metric: "গড় ঘুমের সময়কাল",
      change: "৭.২ ঘণ্টা",
      isPositive: true,
      explanation: "মাসের সামগ্রিক ঘুমের মান আগের মাসের তুলনায় উল্লেখযোগ্য হারে স্থিতিশীল।",
    },
  ] as TrendItem[],
  suggestions: [
    {
      id: "msg1",
      title: "মাসিক বাজেটের ২০% ইমার্জেন্সি ফান্ডে রাখুন",
      actionText: "মাস শুরুর সাথে সাথেই সঞ্চয় আলাদা করার ব্যবস্থা করো।",
      priority: "high",
    },
  ] as SuggestionItem[],
};

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");
  const [isGenerating, setIsGenerating] = useState(false);

  const activeData = timeRange === "weekly" ? weeklyData : monthlyData;

  const handleGenerateInsights = () => {
    setIsGenerating(true);
    // TODO: Call backend AI API to synthesize recent days' entries and update user habits
    setTimeout(() => {
      setIsGenerating(false);
      alert("কাকা তোমার সাম্প্রতিক ডাটা বিশ্লেষণ করে ইনসাইট হালনাগাদ করেছে! ✨");
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <header className="px-4 md:px-8 py-4 border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                বিশ্লেষণ ও ইনসাইট
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-accent-light text-accent text-xs font-semibold">
                AI Intelligence
              </span>
            </div>
            <p className="text-xs md:text-sm text-muted">
              তোমার দৈনন্দিন অভ্যাস, জীবনধারা এবং ট্রেন্ডের গভীর পর্যালোচনা
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Weekly / Monthly Toggle */}
            <div className="flex items-center bg-surface p-1 rounded-xl border border-border">
              <button
                onClick={() => setTimeRange("weekly")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-theme",
                  timeRange === "weekly"
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                )}
              >
                সাপ্তাহিক
              </button>
              <button
                onClick={() => setTimeRange("monthly")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-theme",
                  timeRange === "monthly"
                    ? "bg-accent text-white shadow-sm"
                    : "text-muted hover:text-foreground"
                )}
              >
                মাসিক
              </button>
            </div>

            {/* Generate Insights Button */}
            <button
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white text-xs md:text-sm font-medium rounded-xl hover:bg-accent-hover transition-theme shadow-sm disabled:opacity-60"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isGenerating ? "বিশ্লেষণ হচ্ছে..." : "নতুন বিশ্লেষণ তৈরি করো"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {/* pb-20 on mobile to allow clearance for bottom nav bar */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-6 space-y-6">
        {/* Top AI Summary Card */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                কাকার সারসংক্ষেপ ({timeRange === "weekly" ? "সাপ্তাহিক" : "মাসিক"})
              </h2>
              <p className="text-xs text-muted">
                তোমার লগ করা কাজের ডাটা ও প্যাটার্ন বিশ্লেষণ
              </p>
            </div>
          </div>

          <p className="text-sm text-foreground leading-relaxed bg-surface p-3.5 rounded-xl border border-border">
            &ldquo;{activeData.summary}&rdquo;
          </p>
        </div>

        {/* Charts / Activity Balance Area Placeholder */}
        <div className="bg-white border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-accent" />
              <h3 className="text-sm md:text-base font-bold text-foreground">
                লাইফ ব্যালেন্স ও ক্যাটাগরি মেট্রিক্স
              </h3>
            </div>
            <span className="text-xs text-muted bg-surface px-2.5 py-1 rounded-lg border border-border">
              {timeRange === "weekly" ? "বিগত ৭ দিনের তুলনা" : "বিগত ৩০ দিনের তুলনা"}
            </span>
          </div>

          {/* Clean Mock Charts Visual */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            {/* Metric Bar 1: Work */}
            <div className="bg-surface p-3.5 rounded-xl border border-border space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>কাজ (Work)</span>
                <span className="font-bold text-foreground">৭৫%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-accent h-2.5 rounded-full transition-all duration-500"
                  style={{ width: "75%" }}
                />
              </div>
              <span className="text-[11px] text-success block">
                ধারাবাহিক ও নিয়মতান্ত্রিক
              </span>
            </div>

            {/* Metric Bar 2: Health */}
            <div className="bg-surface p-3.5 rounded-xl border border-border space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>স্বাস্থ্য (Health)</span>
                <span className="font-bold text-foreground">৬৮%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: "68%" }}
                />
              </div>
              <span className="text-[11px] text-muted block">
                ঘুমের সময় উন্নতি প্রয়োজন
              </span>
            </div>

            {/* Metric Bar 3: Finance */}
            <div className="bg-surface p-3.5 rounded-xl border border-border space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>আর্থিক বাজেট (Finance)</span>
                <span className="font-bold text-foreground">৮২%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: "82%" }}
                />
              </div>
              <span className="text-[11px] text-warning block">
                বাজেট সতর্কতার কাছাকাছি
              </span>
            </div>

            {/* Metric Bar 4: Career */}
            <div className="bg-surface p-3.5 rounded-xl border border-border space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>লার্নিং (Career)</span>
                <span className="font-bold text-foreground">৯০%</span>
              </div>
              <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: "90%" }}
                />
              </div>
              <span className="text-[11px] text-success block">
                চমৎকার অগ্রগতি
              </span>
            </div>
          </div>
        </div>

        {/* Good Habits & Bad Habits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Section: Good Habits */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-success flex items-center justify-center">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm md:text-base font-bold text-foreground">
                ভালো অভ্যাস ও অগ্রগতি ({activeData.goodHabits.length})
              </h3>
            </div>

            <div className="space-y-2.5">
              {activeData.goodHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="bg-white border border-border rounded-xl p-4 shadow-sm space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      {habit.title}
                    </h4>
                    {habit.streakCount && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-success border border-emerald-200 font-medium shrink-0">
                        {habit.streakCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted pl-5.5">{habit.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Bad Habits / Areas of Improvement */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-danger flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm md:text-base font-bold text-foreground">
                উন্নতির ক্ষেত্র ও সম্ভাব্য বদভ্যাস ({activeData.badHabits.length})
              </h3>
            </div>

            <div className="space-y-2.5">
              {activeData.badHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="bg-white border border-border rounded-xl p-4 shadow-sm space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-danger shrink-0" />
                      {habit.title}
                    </h4>
                    {habit.streakCount && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-50 text-danger border border-rose-200 font-medium shrink-0">
                        {habit.streakCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted pl-5.5">{habit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trends Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-accent flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-foreground">
              ধারাবাহিকতা ও প্রবণতা (Trends)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeData.trends.map((trend) => (
              <div
                key={trend.id}
                className="bg-white border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-muted">
                      {trend.metric}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5",
                        trend.isPositive
                          ? "bg-emerald-50 text-success border border-emerald-200"
                          : "bg-rose-50 text-danger border border-rose-200"
                      )}
                    >
                      {trend.isPositive ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {trend.change}
                    </span>
                  </div>
                  <p className="text-xs text-foreground mt-2">
                    {trend.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-foreground">
              কাকার পরামর্শ ও করণীয়
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeData.suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-white border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-900 border border-amber-200 inline-block">
                    {suggestion.priority === "high" ? "জরুরি অগ্রাধিকার" : "সাধারণ পরামর্শ"}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">
                    {suggestion.title}
                  </h4>
                  <p className="text-xs text-muted leading-relaxed">
                    {suggestion.actionText}
                  </p>
                </div>

                <button
                  onClick={() => {
                    // TODO: Set reminder or apply suggestion in routine
                    alert(`"${suggestion.title}" রুটিনে যুক্ত করা হয়েছে!`);
                  }}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-2 transition-theme text-center"
                >
                  রুটিনে যুক্ত করো
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
