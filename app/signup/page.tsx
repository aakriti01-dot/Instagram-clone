"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({ id: data.user.id, username: trimmedUsername });

        if (profileError) {
          setError(
            profileError.code === "23505"
              ? "That username is already taken."
              : profileError.message
          );
          return;
        }
      }

      if (data.session) {
        router.push("/feed");
        router.refresh();
      } else {
        setNotice(
          "Check your email to confirm your account before signing in."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <span className="font-serif text-2xl italic tracking-tight text-[var(--ink)]">
          FrontierGram
        </span>
        <h1 className="mt-6 font-serif text-3xl italic text-[var(--ink)]">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          A light that connects people.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="username"
            className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            required
            minLength={3}
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
          />
        </div>

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
            minLength={6}
            autoComplete="new-password"
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
        {notice && (
          <p className="rounded-lg border border-[var(--powder)] bg-[var(--powder-tint)] px-3.5 py-2.5 text-sm text-[var(--ink)]">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--cream)] transition-opacity disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--ink)] underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </main>
  );
}
