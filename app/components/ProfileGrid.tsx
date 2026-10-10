"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getTaggedPosts, type FeedPost } from "@/lib/posts";
import Spinner from "@/app/components/Spinner";

function PostGrid({
  posts,
  emptyTitle,
  emptyDescription,
}: {
  posts: FeedPost[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="font-serif text-xl italic text-[var(--ink)]">
          {emptyTitle}
        </p>
        <p className="max-w-xs text-sm text-[var(--ink-soft)]">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-1 grid grid-cols-3 gap-0.5 sm:gap-1 lg:grid-cols-4 lg:gap-2">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="relative aspect-square overflow-hidden bg-[var(--cream)]"
        >
          <Image
            src={post.imageUrl}
            alt={`Photo shared by ${post.username}`}
            fill
            className="object-cover transition-opacity hover:opacity-90"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 33vw"
          />
        </Link>
      ))}
    </div>
  );
}

export default function ProfileGrid({
  posts,
  profileUserId,
  viewerId,
  emptyTitle,
  emptyDescription,
}: {
  posts: FeedPost[];
  profileUserId: string;
  viewerId: string | null;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [tab, setTab] = useState<"posts" | "tagged">("posts");
  // null = not fetched yet. Once fetched, the result stays here for the rest
  // of this page session, so switching tabs back and forth never re-fetches.
  const [taggedPosts, setTaggedPosts] = useState<FeedPost[] | null>(null);
  const [taggedLoading, setTaggedLoading] = useState(false);
  const [taggedError, setTaggedError] = useState(false);

  function handleTabChange(next: "posts" | "tagged") {
    setTab(next);

    if (next === "tagged" && taggedPosts === null && !taggedLoading) {
      setTaggedLoading(true);
      setTaggedError(false);
      getTaggedPosts(profileUserId, viewerId ?? undefined)
        .then((data) => setTaggedPosts(data))
        .catch(() => setTaggedError(true))
        .finally(() => setTaggedLoading(false));
    }
  }

  return (
    <>
      <div className="mt-10 flex items-center justify-center gap-10 border-t border-[var(--line)] sm:justify-start">
        <button
          type="button"
          onClick={() => handleTabChange("posts")}
          className={
            tab === "posts"
              ? "-mt-px border-t-2 border-[var(--ink)] pt-3 text-xs font-medium tracking-wide text-[var(--ink)] uppercase"
              : "-mt-px border-t-2 border-transparent pt-3 text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase transition-colors hover:text-[var(--ink)]"
          }
        >
          Posts
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("tagged")}
          className={
            tab === "tagged"
              ? "-mt-px border-t-2 border-[var(--ink)] pt-3 text-xs font-medium tracking-wide text-[var(--ink)] uppercase"
              : "-mt-px border-t-2 border-transparent pt-3 text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase transition-colors hover:text-[var(--ink)]"
          }
        >
          Tagged
        </button>
      </div>

      {tab === "posts" ? (
        <PostGrid
          posts={posts}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      ) : taggedLoading ? (
        <p className="flex items-center justify-center gap-2 py-20 text-sm text-[var(--ink-soft)]">
          <Spinner />
          Loading tagged photos…
        </p>
      ) : taggedError ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="font-serif text-xl italic text-[var(--ink)]">
            Something went wrong
          </p>
          <p className="max-w-xs text-sm text-[var(--ink-soft)]">
            We couldn&apos;t load tagged photos right now. Please try again
            shortly.
          </p>
        </div>
      ) : (
        <PostGrid
          posts={taggedPosts ?? []}
          emptyTitle="No tagged posts yet"
          emptyDescription="Photos this person is tagged in will appear here."
        />
      )}
    </>
  );
}
