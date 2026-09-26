"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
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
        <div className="flex w-full max-w-md flex-col items-center gap-10">
          <div className="relative h-[420px] w-full">
            <div className="absolute top-0 left-1/2 h-72 w-56 -translate-x-[68%] -rotate-3 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)]">
              <Image
                src="/assets/login1.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="224px"
              />
            </div>
            <div className="absolute top-4 right-0 h-40 w-32 rotate-6 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)]">
              <Image
                src="/assets/login2.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            <div className="absolute bottom-0 left-0 h-36 w-44 -rotate-6 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)]">
              <Image
                src="/assets/login3.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="176px"
              />
            </div>
          </div>
          <p className="max-w-xs text-center font-serif text-3xl leading-snug text-[var(--ink)] italic">
            Photos that matter, shared with intention.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16 lg:px-16">
        <div className="mb-10 text-center">
          <span className="font-serif text-3xl italic tracking-tight text-[var(--ink)]">
            FrontierGram
          </span>
          <h1 className="mt-6 font-serif text-4xl italic text-[var(--ink)]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Sign in to continue to FrontierGram.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-base text-[var(--ink)] outline-none focus:border-[var(--blush)]"
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
              className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-base text-[var(--ink)] outline-none focus:border-[var(--blush)]"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-[var(--blush)] bg-[var(--blush-tint)] px-4 py-3 text-sm text-[var(--ink)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-[var(--ink)] px-6 py-3 text-base font-medium text-[var(--cream)] transition-opacity disabled:opacity-60"
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
