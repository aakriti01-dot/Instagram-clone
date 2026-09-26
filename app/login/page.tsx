"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col lg:flex-row">
      <div
        className="relative hidden flex-1 items-center justify-center overflow-hidden bg-[var(--blush-tint)] px-12 lg:flex"
        aria-hidden="true"
      >
        <div className="absolute inset-0">
          <div className="absolute top-[16%] left-[14%] h-40 w-32 rotate-[-6deg] rounded-2xl border border-[var(--line)] bg-[var(--paper)]" />
          <div className="absolute top-[8%] left-[40%] h-48 w-36 rotate-[4deg] rounded-2xl border border-[var(--line)] bg-[var(--powder-tint)]" />
          <div className="absolute top-[46%] left-[30%] h-44 w-40 rotate-[-3deg] rounded-2xl border border-[var(--line)] bg-[var(--cream)]" />
          <div className="absolute top-[20%] right-[12%] h-36 w-28 rotate-[8deg] rounded-2xl border border-[var(--line)] bg-[var(--paper)]" />
          <div className="absolute right-[8%] bottom-[14%] h-40 w-32 rotate-[-5deg] rounded-2xl border border-[var(--line)] bg-[var(--powder-tint)]" />
        </div>
        <p className="relative z-10 max-w-xs text-center font-serif text-3xl leading-snug text-[var(--ink)] italic">
          Photos that matter, shared with intention.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
        <div className="mb-8 text-center">
          <span className="font-serif text-2xl italic tracking-tight text-[var(--ink)]">
            FrontierGram
          </span>
          <h1 className="mt-6 font-serif text-3xl italic text-[var(--ink)]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Sign in to continue to FrontierGram.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-[var(--blush)] bg-[var(--blush-tint)] px-3.5 py-2.5 text-sm text-[var(--ink)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--cream)] transition-opacity disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
          New to FrontierGram?{" "}
          <Link
            href="/signup"
            className="text-[var(--ink)] underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
