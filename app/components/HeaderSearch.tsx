"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { searchProfiles, type Profile } from "@/lib/profiles";
import { getFollowingIds } from "@/lib/follows";
import { SearchIcon } from "@/app/components/icons";
import FollowButton from "@/app/components/FollowButton";

const DEBOUNCE_MS = 300;

function resultInitial(result: Profile) {
  return (result.displayName || result.username).charAt(0).toUpperCase();
}

export default function HeaderSearch({ viewerId }: { viewerId: string | null }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleQueryChange(value: string) {
    setQuery(value);
    setOpen(true);
    if (!value.trim()) {
      setResults([]);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    let cancelled = false;

    const timer = setTimeout(() => {
      Promise.all([
        searchProfiles(trimmed, viewerId ?? undefined),
        viewerId ? getFollowingIds(viewerId) : Promise.resolve(new Set<string>()),
      ])
        .then(([profiles, ids]) => {
          if (cancelled) return;
          setResults(profiles);
          setFollowingIds(ids);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
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

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const trimmed = query.trim();
  const showPanel = open && trimmed.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
        <input
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search"
          className="w-full rounded-full border border-[var(--line)] bg-[var(--paper)] py-2 pr-4 pl-10 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
        />
      </div>

      {showPanel && (
        <div className="absolute top-full left-0 z-30 mt-2 max-h-96 w-full min-w-[22rem] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-[0_8px_24px_rgba(37,35,33,0.12)]">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--ink-soft)]">
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--ink-soft)]">
              No one matches &ldquo;{trimmed}&rdquo;.
            </p>
          ) : (
            <ul className="flex flex-col py-1">
              {results.map((result) => (
                <li
                  key={result.id}
                  className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-[var(--cream)]"
                >
                  <Link
                    href={`/profile/${result.username}`}
                    onClick={() => setOpen(false)}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    {result.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={result.avatarUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--powder-tint)] font-serif text-sm text-[var(--ink)]">
                        {resultInitial(result)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ink)]">
                        @{result.username}
                      </p>
                      {result.displayName && (
                        <p className="truncate text-xs text-[var(--ink-soft)]">
                          {result.displayName}
                        </p>
                      )}
                    </div>
                  </Link>

                  <FollowButton
                    viewerId={viewerId}
                    targetUserId={result.id}
                    initialFollowing={followingIds.has(result.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
