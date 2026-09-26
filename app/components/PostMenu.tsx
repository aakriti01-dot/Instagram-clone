"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KebabIcon } from "@/app/components/icons";
import { deletePost } from "@/lib/posts";

export default function PostMenu({
  postId,
  userId,
  imageUrl,
}: {
  postId: number;
  userId: string;
  imageUrl: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    setConfirming(false);
    setOpen(false);
    setError(null);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setError(null);

    try {
      const result = await deletePost(postId, userId, imageUrl);
      if (result.storageCleanupFailed) {
        console.warn(
          "Post deleted, but its image could not be fully removed from storage."
        );
      }
      router.refresh();
    } catch {
      setError("Couldn't delete this post. Try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="relative z-20 shrink-0">
      <button
        type="button"
        aria-label="More options"
        title="More options"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
      >
        <KebabIcon className="h-[18px] w-[18px]" />
      </button>

      {open && !confirming && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)] shadow-[0_4px_16px_rgba(37,35,33,0.08)]">
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="block w-full px-4 py-2.5 text-left text-sm text-[var(--ink)] transition-colors hover:bg-[var(--cream)]"
            >
              Delete post
            </button>
          </div>
        </>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center sm:p-4"
          onClick={() => !deleting && handleCancel()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete post"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-t-2xl bg-[var(--paper)] p-5 sm:rounded-2xl sm:border sm:border-[var(--line)]"
          >
            <p className="font-serif text-lg italic text-[var(--ink)]">
              Delete this post?
            </p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              This can&apos;t be undone.
            </p>

            {error && (
              <p className="mt-3 rounded-lg border border-[var(--blush)] bg-[var(--blush-tint)] px-3.5 py-2.5 text-sm text-[var(--ink)]">
                {error}
              </p>
            )}

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={deleting}
                className="rounded-full px-4 py-2 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-full border border-[var(--blush)] px-4 py-2 text-sm font-medium text-[var(--blush)] transition-colors hover:bg-[var(--blush-tint)] disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
