import type { FeedPost } from "@/lib/posts";
import { KebabIcon, ShareIcon } from "@/app/components/icons";
import LikeButton from "@/app/components/LikeButton";
import CommentButton from "@/app/components/CommentButton";

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
  viewerId,
  viewerUsername,
}: {
  post: FeedPost;
  index: number;
  viewerId: string | null;
  viewerUsername: string | null;
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--ink)]">
            {post.username}
          </p>
          {date && (
            <time className="block text-xs text-[var(--ink-soft)]">
              {date}
            </time>
          )}
        </div>
        <button
          type="button"
          aria-label="More options"
          title="More options"
          className="text-[var(--ink-soft)]"
        >
          <KebabIcon className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="bg-[var(--cream)]">
        {/* Real, unknown-dimension uploads: a plain img preserves natural
            aspect ratio without the distortion risk of a fixed box. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.imageUrl}
          alt={`Photo shared by ${post.username}`}
          loading={index === 0 ? "eager" : "lazy"}
          className="h-auto w-full"
        />
      </div>

      <div className="flex items-center gap-4 px-4 pt-3">
        <LikeButton
          postId={post.id}
          viewerId={viewerId}
          initialLiked={post.likedByCurrentUser}
          initialCount={post.likeCount}
        />
        <CommentButton
          postId={post.id}
          viewerId={viewerId}
          viewerUsername={viewerUsername}
          initialCount={post.commentCount}
        />
        <button
          type="button"
          aria-label="Share"
          title="Share"
          className="text-[var(--ink)] transition-colors hover:text-[var(--blush)]"
        >
          <ShareIcon className="h-[22px] w-[22px]" />
        </button>
      </div>

      <div className="px-4 pt-2 pb-4">
        {post.caption && (
          <p className="text-sm leading-relaxed break-words text-[var(--ink)]">
            <span className="mr-1.5 font-medium">{post.username}</span>
            {post.caption}
          </p>
        )}
      </div>
    </article>
  );
}
