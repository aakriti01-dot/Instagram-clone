"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SPLASH_DURATION_MS = 1400;

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <span className="animate-[splash-fade_1400ms_ease-in-out] font-serif text-4xl italic tracking-tight text-[var(--ink)] sm:text-5xl motion-reduce:animate-none">
        FrontierGram
      </span>
    </div>
  );
}
