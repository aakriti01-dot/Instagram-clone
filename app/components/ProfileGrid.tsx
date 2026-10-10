"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { FeedPost } from "@/lib/posts";

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
    <div className="mt-1 grid grid-cols-3 gap-0.5 sm:gap-1">
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
            sizes="(min-width: 640px) 33vw, 33vw"
          />
        </Link>
      ))}
    </div>
  );
}

export default function ProfileGrid({
  posts,
  taggedPosts,
  emptyTitle,
  emptyDescription,
}: {
  posts: FeedPost[];
  taggedPosts: FeedPost[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [tab, setTab] = useState<"posts" | "tagged">("posts");

  return (
    <>
      <div className="mt-10 flex items-center justify-center gap-10 border-t border-[var(--line)] sm:justify-start">
        <button
          type="button"
          onClick={() => setTab("posts")}
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
          onClick={() => setTab("tagged")}
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
      ) : (
        <PostGrid
          posts={taggedPosts}
          emptyTitle="No tagged posts yet"
          emptyDescription="Photos this person is tagged in will appear here."
        />
      )}
    </>
  );
}
