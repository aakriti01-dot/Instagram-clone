import { createBrowserClient } from "@supabase/ssr";

// A fresh createBrowserClient() call re-parses cookies and reinitializes a
// new GoTrueClient every time — real, blocking work. Called on every like/
// comment/follow click (each of which calls this fresh), that cost sits
// right between the optimistic state update and the browser's next paint,
// so interactions visibly lag even though the UI logic itself is already
// optimistic. Memoizing to one instance per browser session removes it, and
// also resolves the "Multiple GoTrueClient instances" warning this caused.
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return client;
}
