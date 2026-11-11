import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { generate } from "@/ai/gemini";
import { extractItems, saveItems } from "@/ai/extract";
import { buildChatSystemPrompt } from "@/ai/prompts";
import { buildTodaySummary } from "@/lib/summary";
import { logApiCall, logGeneration } from "@/lib/logger";
import { isValidTimeZone, localIso } from "@/lib/time";
import type { ChatApiResponse, ChatMessage } from "@/ai/types";

const Body = z.object({
  text: z.string().trim().min(1).max(4000),
  timeZone: z.string().optional(),
  inputMode: z.enum(["text", "voice"]).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "text দরকার" }, { status: 400 });
  }
  const { text, inputMode = "text" } = parsed.data;
  const timeZone = isValidTimeZone(parsed.data.timeZone) ? parsed.data.timeZone : "Asia/Dubai";
  // One running conversation per user for now
  const conversationId = user.id;

  // 1. Store the user's message
  const { data: userMsg } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, role: "user", content: text, input_mode: inputMode })
    .select("id")
    .single();

  // 2. Extract facts and save them
  let saved: ChatApiResponse["saved"] = [];
  let clarify: string[] = [];
  try {
    const ex = await extractItems(text, timeZone);
    await logGeneration(supabase, "extract", ex);
    const res = await saveItems(supabase, ex.items, {
      rawText: text,
      sourceMessageId: userMsg?.id ?? null,
      timeZone,
    });
    saved = res.saved;
    clarify = res.clarify;
  } catch (err) {
    await logApiCall(supabase, { provider: "gemini", endpoint: "extract", status: 500, latencyMs: 0, error: (err as Error).message });
  }

  // 3. Build context and reply
  try {
    const [history, memories, todaySummary] = await Promise.all([
      supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(21),
      supabase
        .from("memories")
        .select("content")
        .eq("status", "approved")
        .is("deleted_at", null)
        .order("pinned", { ascending: false })
        .order("importance", { ascending: false })
        .limit(30),
      buildTodaySummary(supabase, timeZone),
    ]);

    const messages: ChatMessage[] = (history.data ?? [])
      .reverse()
      .map((m) => ({ role: m.role as ChatMessage["role"], content: m.content }));
    // Gemini needs the conversation to start with a user turn
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length) messages.push({ role: "user", content: text });

    const system = buildChatSystemPrompt({
      memories: (memories.data ?? []).map((m) => m.content),
      todaySummary,
      saved: saved.map((s) => s.label),
      clarify,
      now: localIso(timeZone),
    });

    const reply = await generate({ system, messages });
    await logGeneration(supabase, "chat", reply);

    const { data: botMsg } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, role: "assistant", content: reply.text, provider: reply.model })
      .select("id")
      .single();

    const body: ChatApiResponse = {
      reply: reply.text,
      model: reply.model,
      saved,
      userMessageId: userMsg?.id,
      assistantMessageId: botMsg?.id,
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = (err as Error).message;
    await logApiCall(supabase, { provider: "gemini", endpoint: "chat", status: 500, latencyMs: 0, error: message });
    const body: ChatApiResponse = {
      reply: saved.length
        ? `${saved.map((s) => s.label).join(", ")} সেভ করেছি, কিন্তু উত্তর দিতে সমস্যা হলো। একটু পরে আবার বলো।`
        : "দুঃখিত, এই মুহূর্তে AI-এর সাথে সংযোগ হচ্ছে না। একটু পরে আবার চেষ্টা করো।",
      saved,
      userMessageId: userMsg?.id,
      error: message,
    };
    return NextResponse.json(body, { status: 502 });
  }
}
