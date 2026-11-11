"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Utensils,
  Wallet,
  Activity,
  PhoneCall,
  GraduationCap,
  HandCoins,
  Clock,
  LogIn,
  LogOut,
  TrendingUp,
  TrendingDown,
  Moon,
  Droplets,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { format, subDays, addDays, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

// Types for Dashboard metrics
interface WorkSummary {
  hoursWorked: string;
  punchIn: string;
  punchOut: string | null;
  status: "working" | "completed" | "off";
  breaksDuration: string;
  tasksCompleted: number;
}

interface FoodSummary {
  mealCount: number;
  totalSpend: number;
  meals: { time: string; name: string; cost?: number }[];
}

interface FinanceSummary {
  spent: number;
  earned: number;
  budgetStatus: "safe" | "warning";
  topCategory: string;
}

interface HealthSummary {
  sleepHours: string;
  waterGlasses: number;
  targetWater: number;
  exerciseMinutes: number;
  mood: string;
}

interface SocialSummary {
  callsCount: number;
  visitsCount: number;
  notableContacts: string[];
}

interface CareerSummary {
  completedItems: number;
  totalItems: number;
  keyAchievement: string;
}

interface DebtsSummary {
  totalToReceive: number;
  totalToPay: number;
  pendingPeopleCount: number;
}

interface DayData {
  work: WorkSummary;
  food: FoodSummary;
  finance: FinanceSummary;
  health: HealthSummary;
  social: SocialSummary;
  career: CareerSummary;
  debts: DebtsSummary;
}

// TODO: Replace with real Supabase / React Query data fetching for selectedDate
const placeholderData: DayData = {
  work: {
    hoursWorked: "৭ ঘণ্টা ৩০ মি.",
    punchIn: "০৯:১৫ AM",
    punchOut: "০৫:৪৫ PM",
    status: "completed",
    breaksDuration: "৪৫ মিনিট",
    tasksCompleted: 4,
  },
  food: {
    mealCount: 3,
    totalSpend: 420,
    meals: [
      { time: "সকাল", name: "পরোটা ও ডিম", cost: 60 },
      { time: "দুপুর", name: "ভাত, মাছ ও ডাল", cost: 220 },
      { time: "রাত", name: "চিকেন খিচুড়ি", cost: 140 },
    ],
  },
  finance: {
    spent: 1250,
    earned: 0,
    budgetStatus: "safe",
    topCategory: "খাবার ও যাতায়াত",
  },
  health: {
    sleepHours: "৭ ঘণ্টা ১৫ মি.",
    waterGlasses: 7,
    targetWater: 8,
    exerciseMinutes: 30,
    mood: "উৎফুল্ল ও সতেজ",
  },
  social: {
    callsCount: 3,
    visitsCount: 1,
    notableContacts: ["মা", "রাহিম", "অফিস টিম"],
  },
  career: {
    completedItems: 2,
    totalItems: 3,
    keyAchievement: "সিস্টেম আর্কিটেকচার রিভিউ সমাপ্ত",
  },
  debts: {
    totalToReceive: 2500,
    totalToPay: 800,
    pendingPeopleCount: 2,
  },
};

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Date navigation handlers
  const handlePreviousDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate((prev) => addDays(prev, 1));
  const handleSelectToday = () => setSelectedDate(new Date());

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "আজ";
    if (isYesterday(date)) return "গতকাল";
    return format(date, "EEEE");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Sticky Top Header */}
      <header className="px-4 md:px-8 py-4 border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">ড্যাশবোর্ড</h1>
          <p className="text-xs md:text-sm text-muted">
            তোমার দৈনন্দিন কার্যক্রম ও সামগ্রিক সারসংক্ষেপ
          </p>
        </div>

        {/* Date Switcher */}
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border self-start sm:self-auto">
          <button
            onClick={handlePreviousDay}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white transition-theme"
            title="আগের দিন"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleSelectToday}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-lg transition-theme",
              isToday(selectedDate)
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white"
            )}
          >
            আজ
          </button>

          <button
            onClick={() => setSelectedDate(subDays(new Date(), 1))}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-lg transition-theme",
              isYesterday(selectedDate)
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white"
            )}
          >
            গতকাল
          </button>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Date Picker Display */}
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-foreground bg-white rounded-lg border border-border/60">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span>
              {getDateLabel(selectedDate)}, {format(selectedDate, "dd MMM yyyy")}
            </span>
            <input
              type="date"
              aria-label="তারিখ নির্বাচন করুন"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(new Date(e.target.value));
                }
              }}
              className="opacity-0 absolute w-6 h-6 cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white transition-theme"
            title="পরের দিন"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {/* pb-20 on mobile to avoid overlapping the bottom navigation bar */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-6 space-y-6">
        {/* Top Highlight Banner */}
        <div className="bg-gradient-to-r from-accent-light via-blue-50 to-surface border border-accent/20 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-foreground">
                {getDateLabel(selectedDate)} দিনের পর্যালোচনা
              </h2>
              <p className="text-xs text-muted">
                কাকা তোমার সব এন্ট্রি স্বয়ংক্রিয়ভাবে গুছিয়ে রেখেছে।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1.5 bg-white rounded-lg border border-border text-foreground font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              কাজের স্থিতি: সম্পন্ন
            </span>
            <span className="px-3 py-1.5 bg-white rounded-lg border border-border text-foreground font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              ব্যয়: ৳ ১,২৫০
            </span>
          </div>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {/* Card 1: Work */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  কাজের হিসাব
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-accent flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {placeholderData.work.hoursWorked}
                </p>
                <p className="text-xs text-muted flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  {placeholderData.work.tasksCompleted} টি টাস্ক সম্পন্ন
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <LogIn className="w-3.5 h-3.5 text-success" /> ইন
                </span>
                <span className="font-medium text-foreground">
                  {placeholderData.work.punchIn}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <LogOut className="w-3.5 h-3.5 text-warning" /> আউট
                </span>
                <span className="font-medium text-foreground">
                  {placeholderData.work.punchOut || "কর্মরত"}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> বিরতি
                </span>
                <span className="font-medium text-foreground">
                  {placeholderData.work.breaksDuration}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Food */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  খাবার ও পুষ্টি
                </span>
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold text-foreground">
                    {placeholderData.food.mealCount} বেলা
                  </p>
                  <span className="text-sm font-semibold text-foreground">
                    ৳ {placeholderData.food.totalSpend}
                  </span>
                </div>
                <p className="text-xs text-muted">আজকের মোট খাবারের ব্যয়</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-1.5 text-xs">
              {placeholderData.food.meals.map((meal, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-muted">
                    {meal.time}: <strong className="font-medium text-foreground">{meal.name}</strong>
                  </span>
                  <span className="text-muted font-medium">৳ {meal.cost}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Finance */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  আর্থিক লেনদেন
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-success flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  ৳ {placeholderData.finance.spent}
                </p>
                <p className="text-xs text-muted flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-danger" />
                  আজকের মোট খরচ
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-success" /> আজকের আয়
                </span>
                <span className="font-medium text-foreground">
                  ৳ {placeholderData.finance.earned}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>শীর্ষ খাত</span>
                <span className="font-medium text-foreground">
                  {placeholderData.finance.topCategory}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>বাজেট স্থিতি</span>
                <span className="text-success font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  নিয়ন্ত্রণে আছে
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Health */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  স্বাস্থ্য ও যত্ন
                </span>
                <div className="w-8 h-8 rounded-lg bg-red-50 text-danger flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {placeholderData.health.sleepHours}
                </p>
                <p className="text-xs text-muted flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-accent" />
                  গভীর ও পর্যাপ্ত ঘুম
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> পানি পান
                </span>
                <span className="font-medium text-foreground">
                  {placeholderData.health.waterGlasses} / {placeholderData.health.targetWater} গ্লাস
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-600" /> শরীরচর্চা
                </span>
                <span className="font-medium text-foreground">
                  {placeholderData.health.exerciseMinutes} মিনিট
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>শারীরিক অনুভূতি</span>
                <span className="font-medium text-foreground">
                  {placeholderData.health.mood}
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: Social */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  সামাজিক যোগাযোগ
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {placeholderData.social.callsCount} টি কল
                </p>
                <p className="text-xs text-muted flex items-center gap-1">
                  {placeholderData.social.visitsCount} টি ব্যক্তিগত সাক্ষাৎ
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-1 text-xs">
              <span className="text-muted block mb-1">গুরুত্বপূর্ণ যোগাযোগ:</span>
              <div className="flex flex-wrap gap-1.5">
                {placeholderData.social.notableContacts.map((contact, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-surface text-foreground font-medium rounded-md border border-border"
                  >
                    {contact}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 6: Career */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  ক্যারিয়ার ও লক্ষ্য
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {placeholderData.career.completedItems} / {placeholderData.career.totalItems} সম্পন্ন
                </p>
                <p className="text-xs text-muted">লক্ষ্যমাত্রার কাজ</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-1.5 text-xs">
              <span className="text-muted block">দিনের বিশেষ অর্জন:</span>
              <p className="font-medium text-foreground bg-surface p-2 rounded-lg border border-border">
                {placeholderData.career.keyAchievement}
              </p>
            </div>
          </div>

          {/* Card 7: Open Debts */}
          <div className="bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  বকেয়া ধারদেনা
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-warning flex items-center justify-center">
                  <HandCoins className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  ৳ {placeholderData.debts.totalToReceive - placeholderData.debts.totalToPay}
                </p>
                <p className="text-xs text-muted">নিট পাওনা হিসাব</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/70 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted">
                <span>পাবো (Lent)</span>
                <span className="font-semibold text-success">
                  ৳ {placeholderData.debts.totalToReceive}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>দেবো (Owe)</span>
                <span className="font-semibold text-danger">
                  ৳ {placeholderData.debts.totalToPay}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>বকেয়া ব্যক্তি</span>
                <span className="font-medium text-foreground">
                  {placeholderData.debts.pendingPeopleCount} জন
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips / Kaka Note */}
        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0" />
          <p className="text-xs md:text-sm text-muted">
            <strong className="text-foreground">কাকার বার্তা:</strong> তুমি আজকের সব টাস্ক বেশ ভালোভাবে এগিয়ে নিয়েছ। রাতে ঘুমানোর আগে আরেক গ্লাস পানি পান করার পরামর্শ রইল!
          </p>
        </div>
      </div>
    </div>
  );
}
