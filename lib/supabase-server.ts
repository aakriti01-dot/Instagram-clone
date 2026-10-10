import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render, where cookies can't be
            // written. Safe to ignore — proxy.ts refreshes the session on
            // every request instead.
          }
        },
      },
    }
  );
}

// supabase.auth.getUser() is a real network round-trip to Supabase's Auth
// server (not a local cookie decode) — it deliberately re-verifies the
// token server-side rather than trusting it, which is exactly why it's safe
// to keep as the source of truth here. The problem was never the check
// itself, just that the shared layout and every page under it were each
// independently paying for that round-trip on every single navigation.
// React's cache() scopes this to one execution per request: every caller
// within the same render gets the same verified result, without changing
// what's actually being verified or skipping the check anywhere.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
