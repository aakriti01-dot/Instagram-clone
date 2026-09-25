"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

const SPLASH_DURATION_MS = 1400;

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const sessionPromise = supabase.auth.getSession();

    const timer = setTimeout(async () => {
      const {
        data: { session },
      } = await sessionPromise;
      if (cancelled) return;
      router.replace(session ? "/feed" : "/login");
    }, SPLASH_DURATION_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <span className="animate-[splash-fade_1400ms_ease-in-out] font-serif text-4xl italic tracking-tight text-[var(--ink)] sm:text-5xl motion-reduce:animate-none">
        FrontierGram
      </span>
    </div>
  );
}
