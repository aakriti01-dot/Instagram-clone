import Image from "next/image";
import type { FeedPost } from "@/lib/posts";
import {
  BookmarkIcon,
  CommentIcon,
  HeartIcon,
  KebabIcon,
  ShareIcon,
} from "@/app/components/icons";

function initials(username: string) {
  return username.charAt(0).toUpperCase();
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function PostCard({
  post,
  index,
}: {
  post: FeedPost;
  index: number;
}) {
  const accentTint = index % 2 === 0 ? "var(--blush-tint)" : "var(--powder-tint)";
  const date = formatDate(post.createdAt);

  return (
    <article className="border-b border-[var(--line)] bg-[var(--paper)] sm:rounded-2xl sm:border sm:border-[var(--line)] sm:shadow-[0_1px_3px_rgba(38,34,32,0.06)]">
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-sm text-[var(--ink)]"
          style={{ backgroundColor: accentTint }}
        >
          {initials(post.username)}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ink)]">
          {post.username}
        </span>
        <button
          type="button"
          aria-label="More options"
          className="text-[var(--ink-soft)]"
        >
          <KebabIcon className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--cream)]">
        <Image
          src={post.imageUrl}
          alt={`Photo shared by ${post.username}`}
          fill
          className="object-cover"
          sizes="(min-width: 640px) 560px, 100vw"
          priority={index === 0}
        />
      </div>

      <div className="flex items-center gap-4 px-4 pt-3">
        <button
          type="button"
          aria-label="Like"
          className="text-[var(--ink)] transition-colors hover:text-[var(--blush)]"
        >
          <HeartIcon className="h-[22px] w-[22px]" />
        </button>
        <button
          type="button"
          aria-label="Comment"
          className="text-[var(--ink)] transition-colors hover:text-[var(--powder)]"
        >
          <CommentIcon className="h-[22px] w-[22px]" />
        </button>
        <button
          type="button"
          aria-label="Share"
          className="text-[var(--ink)] transition-colors hover:text-[var(--blush)]"
        >
          <ShareIcon className="h-[22px] w-[22px]" />
        </button>
        <button
          type="button"
          aria-label="Save"
          className="ml-auto text-[var(--ink)] transition-colors hover:text-[var(--powder)]"
        >
          <BookmarkIcon className="h-[22px] w-[22px]" />
        </button>
      </div>

      <div className="flex flex-col gap-2 px-4 pt-2 pb-4">
        {post.caption && (
          <p className="text-sm leading-relaxed text-[var(--ink)]">
            <span className="mr-1.5 font-medium">{post.username}</span>
            {post.caption}
          </p>
        )}
        <p className="text-sm text-[var(--ink-soft)]">Add a comment…</p>
        {date && (
          <time className="text-[11px] tracking-wide text-[var(--ink-soft)] uppercase">
            {date}
          </time>
        )}
      </div>
    </article>
  );
}
