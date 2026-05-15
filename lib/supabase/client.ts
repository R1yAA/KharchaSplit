"use client";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !key) {
  // Surface misconfiguration loudly in dev. App is unusable without these.
  // eslint-disable-next-line no-console
  console.warn("[KharchaSplit] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Untyped client; row shapes are enforced via lib/supabase/types.ts at the call site.
export const supabase = createClient(url ?? "", key ?? "", {
  auth: { persistSession: false },
});
