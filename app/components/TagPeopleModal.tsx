"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CloseIcon } from "@/app/components/icons";
import { searchProfiles, type Profile } from "@/lib/profiles";
import { tagUsers, untagUser } from "@/lib/postTags";
import type { TaggedUser } from "@/lib/posts";
import Spinner from "@/app/components/Spinner";

const DEBOUNCE_MS = 300;

function resultInitial(name: string) {
  return name.charAt(0).toUpperCase();
}

export default function TagPeopleModal({
  postId,
  viewerId,
  taggedUsers,
  onClose,
  onTagsChange,
}: {
  postId: number;
  viewerId: string;
  taggedUsers: TaggedUser[];
  onClose: () => void;
  onTagsChange: (next: TaggedUser[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      searchProfiles(trimmed, viewerId)
        .then((data) => {
          if (cancelled) return;
          const taggedIds = new Set(taggedUsers.map((u) => u.id));
          setResults(data.filter((p) => !taggedIds.has(p.id)));
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
  }, [query, viewerId, taggedUsers]);

  async function handleAdd(profile: Profile) {
    setError(null);
    setPendingId(profile.id);
    const next = [...taggedUsers, { id: profile.id, username: profile.username }];
    onTagsChange(next);
    setResults((prev) => prev.filter((p) => p.id !== profile.id));

    try {
      await tagUsers(postId, [profile.id]);
    } catch {
      onTagsChange(taggedUsers);
      setError("Couldn't add that tag. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleRemove(userId: string) {
    setError(null);
    setPendingId(userId);
    const previous = taggedUsers;
    onTagsChange(taggedUsers.filter((u) => u.id !== userId));

    try {
      await untagUser(postId, userId);
    } catch {
      onTagsChange(previous);
      setError("Couldn't remove that tag. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tag people"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl bg-[var(--paper)] sm:max-h-[70vh] sm:max-w-md sm:rounded-2xl sm:border sm:border-[var(--line)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <p className="font-serif text-lg italic text-[var(--ink)]">
            Tag people
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="-m-2 rounded-full p-2 text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <input
            type="text"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Search by username…"
            className="w-full rounded-full border border-[var(--line)] bg-[var(--cream)] px-4 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {query.trim() && (
            <div className="mb-4">
              {loading ? (
                <p className="flex items-center justify-center gap-2 py-3 text-sm text-[var(--ink-soft)]">
                  <Spinner />
                  Searching…
                </p>
              ) : results.length === 0 ? (
                <p className="py-3 text-center text-sm text-[var(--ink-soft)]">
                  No matches.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {results.map((profile) => (
                    <li key={profile.id}>
                      <button
                        type="button"
                        onClick={() => handleAdd(profile)}
                        disabled={pendingId === profile.id}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--cream)] disabled:opacity-60"
                      >
                        {profile.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={profile.avatarUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--powder-tint)] font-serif text-sm text-[var(--ink)]">
                            {resultInitial(profile.displayName || profile.username)}
                          </span>
                        )}
                        <span
                          title={`@${profile.username}`}
                          className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ink)]"
                        >
                          @{profile.username}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <p className="mb-2 text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase">
            Tagged
          </p>
          {taggedUsers.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">
              No one tagged yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {taggedUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2"
                >
                  <Link
                    href={`/profile/${user.username}`}
                    title={`@${user.username}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ink)] hover:underline"
                  >
                    @{user.username}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(user.id)}
                    disabled={pendingId === user.id}
                    className="shrink-0 text-xs text-[var(--ink-soft)] transition-colors hover:text-[var(--blush)] disabled:opacity-60"
                  >
                    {pendingId === user.id ? "Removing…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <p className="mt-2 text-xs text-[var(--ink-soft)]">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
