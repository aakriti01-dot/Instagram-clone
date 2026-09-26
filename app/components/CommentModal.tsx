"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon } from "@/app/components/icons";
import {
  addComment,
  buildCommentTree,
  deleteComment,
  getPostComments,
  type Comment,
} from "@/lib/comments";
import { getProfileById } from "@/lib/profiles";

function initials(name: string) {
  return name.charAt(0).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function CommentAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  return avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt=""
      className="h-8 w-8 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--powder-tint)] font-serif text-sm text-[var(--ink)]">
      {initials(name)}
    </span>
  );
}

export default function CommentModal({
  postId,
  viewerId,
  viewerUsername,
  onClose,
  onCountChange,
}: {
  postId: number;
  viewerId: string | null;
  viewerUsername: string | null;
  onClose: () => void;
  onCountChange: (count: number) => void;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [viewerAvatarUrl, setViewerAvatarUrl] = useState<string | null>(null);
  const [viewerDisplayName, setViewerDisplayName] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    username: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    getPostComments(postId)
      .then((data) => {
        if (cancelled) return;
        setComments(data);
        onCountChange(data.length);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    if (viewerId) {
      getProfileById(viewerId)
        .then((profile) => {
          if (cancelled || !profile) return;
          setViewerAvatarUrl(profile.avatarUrl);
          setViewerDisplayName(profile.displayName);
        })
        .catch(() => {
          // Optimistic-render detail only — not worth surfacing an error for.
        });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, viewerId]);

  function handleReply(comment: Comment) {
    setReplyingTo({ id: comment.id, username: comment.username });
  }

  function cancelReply() {
    setReplyingTo(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!viewerId || !viewerUsername) {
      router.push("/login");
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setSubmitError(null);

    const parentId = replyingTo?.id ?? null;

    try {
      const { id, createdAt } = await addComment(
        postId,
        viewerId,
        trimmed,
        parentId
      );
      const newComment: Comment = {
        id,
        postId,
        userId: viewerId,
        username: viewerUsername,
        displayName: viewerDisplayName,
        avatarUrl: viewerAvatarUrl,
        content: trimmed,
        createdAt,
        parentId,
      };
      const next = [...comments, newComment];
      setComments(next);
      onCountChange(next.length);
      setContent("");
      setReplyingTo(null);
    } catch {
      setSubmitError("Couldn't post your comment. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: number) {
    if (!viewerId) return;

    setDeleteError(null);
    setDeletingId(commentId);
    const previous = comments;
    // Deleting a top-level comment cascades to its replies in the database —
    // mirror that locally so the optimistic UI doesn't show orphaned replies.
    const next = previous.filter(
      (comment) => comment.id !== commentId && comment.parentId !== commentId
    );
    setComments(next);
    onCountChange(next.length);

    try {
      await deleteComment(commentId, viewerId);
    } catch {
      setComments(previous);
      onCountChange(previous.length);
      setDeleteError("Couldn't delete that comment. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const thread = buildCommentTree(comments);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Comments"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-[var(--paper)] sm:max-h-[80vh] sm:max-w-md sm:rounded-2xl sm:border sm:border-[var(--line)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <p className="font-serif text-lg italic text-[var(--ink)]">
            Comments
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

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="py-10 text-center text-sm text-[var(--ink-soft)]">
              Loading comments…
            </p>
          ) : loadError ? (
            <p className="py-10 text-center text-sm text-[var(--ink-soft)]">
              Couldn&apos;t load comments. Try again shortly.
            </p>
          ) : thread.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-10 text-center">
              <p className="font-serif text-lg italic text-[var(--ink)]">
                No comments yet.
              </p>
              <p className="text-sm text-[var(--ink-soft)]">
                Be the first to say something.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {thread.map((comment) => (
                <li key={comment.id} className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <CommentAvatar
                      avatarUrl={comment.avatarUrl}
                      name={comment.displayName || comment.username}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed break-words text-[var(--ink)]">
                        <span className="mr-1.5 font-medium">
                          {comment.username}
                        </span>
                        {comment.content}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <time className="text-xs text-[var(--ink-soft)]">
                          {formatDate(comment.createdAt)}
                        </time>
                        <button
                          type="button"
                          onClick={() => handleReply(comment)}
                          className="-m-2 p-2 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                        >
                          Reply
                        </button>
                        {viewerId === comment.userId && (
                          <button
                            type="button"
                            onClick={() => handleDelete(comment.id)}
                            disabled={deletingId === comment.id}
                            className="-m-2 p-2 text-xs text-[var(--ink-soft)] transition-colors hover:text-[var(--blush)] disabled:opacity-60"
                          >
                            {deletingId === comment.id
                              ? "Deleting…"
                              : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {comment.replies.length > 0 && (
                    <ul className="flex flex-col gap-3 pl-11">
                      {comment.replies.map((reply) => (
                        <li key={reply.id} className="flex items-start gap-3">
                          <CommentAvatar
                            avatarUrl={reply.avatarUrl}
                            name={reply.displayName || reply.username}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-relaxed break-words text-[var(--ink)]">
                              <span className="mr-1.5 font-medium">
                                {reply.username}
                              </span>
                              {reply.content}
                            </p>
                            <div className="mt-1 flex items-center gap-3">
                              <time className="text-xs text-[var(--ink-soft)]">
                                {formatDate(reply.createdAt)}
                              </time>
                              {viewerId === reply.userId && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(reply.id)}
                                  disabled={deletingId === reply.id}
                                  className="-m-2 p-2 text-xs text-[var(--ink-soft)] transition-colors hover:text-[var(--blush)] disabled:opacity-60"
                                >
                                  {deletingId === reply.id
                                    ? "Deleting…"
                                    : "Delete"}
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
          {deleteError && (
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              {deleteError}
            </p>
          )}
        </div>

        {replyingTo && (
          <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--cream)] px-4 py-1.5">
            <span className="text-xs text-[var(--ink-soft)]">
              Replying to <span className="font-medium">@{replyingTo.username}</span>
            </span>
            <button
              type="button"
              onClick={cancelReply}
              aria-label="Cancel reply"
              title="Cancel reply"
              className="-m-1.5 p-1.5 text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`flex items-center gap-2 px-4 py-3 ${
            replyingTo ? "" : "border-t border-[var(--line)]"
          }`}
        >
          <input
            type="text"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={
              replyingTo
                ? `Reply to @${replyingTo.username}…`
                : "Add a comment…"
            }
            className="flex-1 rounded-full border border-[var(--line)] bg-[var(--cream)] px-4 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="shrink-0 px-2 py-2 text-sm font-medium text-[var(--blush)] disabled:opacity-40"
          >
            {submitting ? "Posting…" : "Post"}
          </button>
        </form>
        {submitError && (
          <p className="px-4 pb-3 text-xs text-[var(--ink-soft)]">
            {submitError}
          </p>
        )}
      </div>
    </div>
  );
}
