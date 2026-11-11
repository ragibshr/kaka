import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type AuthOk = { ok: true; user: User; supabase: SupabaseClient };
type AuthFail = { ok: false; response: NextResponse };

/** Use at the top of every API route: returns the signed-in user or a 401 response. */
export async function requireUser(): Promise<AuthOk | AuthFail> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "লগইন করা নেই" }, { status: 401 }),
    };
  }
  return { ok: true, user, supabase };
}
