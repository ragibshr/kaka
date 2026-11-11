# কাকা (Kaka) — তোমার AI জীবন-সঙ্গী

বাংলা/ইংরেজিতে দিনের কথা লেখো — কাকা খরচ, খাবার, কাজ, ধার, স্বাস্থ্য, যোগাযোগ আলাদা করে গুছিয়ে রাখে, আর বন্ধুর মতো উত্তর দেয়।

**স্ট্যাক:** Next.js 16 · Supabase (ডাটাবেজ + লগইন) · Gemini API · Tailwind 4

## চালানোর নিয়ম

```bash
npm install
cp .env.local.example .env.local   # তারপর GEMINI_API_KEY বসাও
npm run dev                          # http://localhost:3000
```

প্রথমবার `/auth` থেকে সাইন আপ করো (ইমেইলে নিশ্চিতকরণ লিংক আসবে)।

## ফোল্ডার

| পথ | কী আছে |
|---|---|
| `src/app/page.tsx` | চ্যাট স্ক্রিন |
| `src/app/api/chat` | মেসেজ → তথ্য বের করা → সেভ → উত্তর |
| `src/app/api/health` | ডাটাবেজ + Gemini পরীক্ষা |
| `src/ai/gemini.ts` | Gemini ক্লায়েন্ট (মডেল fallback + retry) |
| `src/ai/extract.ts` | বের করা তথ্য যাচাই (zod) ও টেবিলে সেভ |
| `src/ai/prompts.ts` | সব AI প্রম্পট |
| `src/lib/summary.ts` | "আজকের সারাংশ" — চ্যাটকে আসল সংখ্যা দেয় |
| `src/proxy.ts` | লগইন ছাড়া সব পেজ `/auth`-এ পাঠায় |
| `supabase/migrations/` | ডাটাবেজ schema (Supabase প্রজেক্টে প্রয়োগ করা) |

## অগ্রগতি

- [x] ধাপ ০ — পরিষ্কার, শুধু Gemini, নিরাপত্তা আপডেট
- [x] ধাপ ১ — লগইন (Supabase Auth), API সুরক্ষা
- [x] ধাপ ২ — চ্যাট লুপ: সেভ চিপ + Undo, ইতিহাস, আজকের সারাংশ
- [ ] ধাপ ৩ — Dashboard / Lists / Debts আসল ডেটায়
- [ ] ধাপ ৪ — মেমরি
- [ ] ধাপ ৫ — Insights
- [ ] ধাপ ৬ — ভয়েস + PWA
- [ ] ধাপ ৭ — Vercel deploy
