"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { searchProfiles, type Profile } from "@/lib/profiles";
import { SearchIcon, CloseIcon } from "@/app/components/icons";

const DEBOUNCE_MS = 300;

function resultInitial(result: Profile) {
  return (result.displayName || result.username).charAt(0).toUpperCase();
}

export default function UserSearch({ viewerId }: { viewerId: string | null }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(false);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      setError(false);
    } else {
      setLoading(true);
      setError(false);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    let cancelled = false;

    const timer = setTimeout(() => {
      searchProfiles(trimmed, viewerId ?? undefined)
        .then((data) => {
          if (cancelled) return;
          setResults(data);
          setHasSearched(true);
        })
        .catch(() => {
          if (cancelled) return;
          setError(true);
          setHasSearched(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, viewerId]);

  return (
    <>
      <div className="relative mb-6">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
        <input
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Search"
          autoFocus
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] py-2.5 pr-10 pl-10 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange("")}
            aria-label="Clear search"
            title="Clear search"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {!query.trim() && (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="font-serif text-xl italic text-[var(--ink)]">
            Find people
          </p>
          <p className="max-w-xs text-sm text-[var(--ink-soft)]">
            Search by username to see their profile.
          </p>
        </div>
      )}

      {query.trim() && loading && (
        <p className="py-10 text-center text-sm text-[var(--ink-soft)]">
          Searching…
        </p>
      )}

      {query.trim() && !loading && error && (
        <p className="py-10 text-center text-sm text-[var(--ink-soft)]">
          Couldn&apos;t search right now. Try again.
        </p>
      )}

      {query.trim() && !loading && !error && hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="font-serif text-xl italic text-[var(--ink)]">
            No results
          </p>
          <p className="max-w-xs text-sm text-[var(--ink-soft)]">
            No one matches &ldquo;{query.trim()}&rdquo;.
          </p>
        </div>
      )}

      {query.trim() && !loading && !error && results.length > 0 && (
        <ul className="flex flex-col">
          {results.map((result) => (
            <li
              key={result.id}
              className="border-b border-[var(--line)] last:border-b-0"
            >
              <Link
                href={`/profile/${result.username}`}
                className="flex items-center gap-3 rounded-lg px-1 py-3 transition-colors hover:bg-[var(--cream)]"
              >
                {result.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.avatarUrl}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--powder-tint)] font-serif text-lg text-[var(--ink)]">
                    {resultInitial(result)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--ink)]">
                    {result.username}
                  </p>
                  {result.displayName && (
                    <p className="truncate text-xs text-[var(--ink-soft)]">
                      {result.displayName}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
