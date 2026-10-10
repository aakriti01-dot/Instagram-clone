import Link from "next/link";
import type { FeedPost } from "@/lib/posts";
import { KebabIcon } from "@/app/components/icons";
import LikeButton from "@/app/components/LikeButton";
import CommentButton from "@/app/components/CommentButton";
import PostMenu from "@/app/components/PostMenu";
import PostImage from "@/app/components/PostImage";
import TagPeopleButton from "@/app/components/TagPeopleButton";

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
  viewerAvatarUrl,
  viewerDisplayName,
  autoOpenCommentId,
}: {
  post: FeedPost;
  index: number;
  viewerId: string | null;
  viewerUsername: string | null;
  viewerAvatarUrl: string | null;
  viewerDisplayName: string | null;
  autoOpenCommentId?: number;
}) {
  const accentTint = index % 2 === 0 ? "var(--blush-tint)" : "var(--powder-tint)";
  const date = formatDate(post.createdAt);

  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-[0_1px_3px_rgba(38,34,32,0.06)]">
      <div className="flex items-center gap-3 px-4 py-3">
        {post.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.avatarUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-sm text-[var(--ink)]"
            style={{ backgroundColor: accentTint }}
          >
            {initials(post.username)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--ink)]">
            {post.username}
          </p>
          {post.location && (
            <p
              title={post.location}
              className="truncate text-xs text-[var(--ink-soft)]"
            >
              {post.location}
            </p>
          )}
          {date && (
            <time className="block text-xs text-[var(--ink-soft)]">
              {date}
            </time>
          )}
        </div>
        {viewerId === post.userId ? (
          <PostMenu
            postId={post.id}
            userId={post.userId}
            imageUrl={post.imageUrl}
          />
        ) : (
          <button
            type="button"
            aria-label="More options"
            title="More options"
            className="text-[var(--ink-soft)]"
          >
            <KebabIcon className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      <div className="bg-[var(--cream)]">
        {/* Real, unknown-dimension uploads: a plain img preserves natural
            aspect ratio without the distortion risk of a fixed box. */}
        <PostImage
          src={post.imageUrl}
          alt={`Photo shared by ${post.username}`}
          priority={index === 0}
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
          viewerAvatarUrl={viewerAvatarUrl}
          viewerDisplayName={viewerDisplayName}
          initialCount={post.commentCount}
          autoOpenCommentId={autoOpenCommentId}
        />
        <TagPeopleButton
          postId={post.id}
          viewerId={viewerId}
          isOwner={viewerId === post.userId}
          initialTaggedUsers={post.taggedUsers}
        />
      </div>

      <div className="px-4 pt-2 pb-4">
        {post.caption && (
          <p className="text-sm leading-relaxed break-words text-[var(--ink)]">
            <span className="mr-1.5 font-medium">{post.username}</span>
            {post.caption}
          </p>
        )}
        {post.taggedUsers.length > 0 && (
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Tagged:{" "}
            {post.taggedUsers.map((user, index) => (
              <span key={user.id}>
                <Link
                  href={`/profile/${user.username}`}
                  className="font-medium text-[var(--ink)] hover:underline"
                >
                  @{user.username}
                </Link>
                {index < post.taggedUsers.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
