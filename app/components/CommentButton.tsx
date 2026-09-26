"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CommentIcon } from "@/app/components/icons";
import CommentModal from "@/app/components/CommentModal";

export default function CommentButton({
  postId,
  viewerId,
  viewerUsername,
  initialCount,
}: {
  postId: number;
  viewerId: string | null;
  viewerUsername: string | null;
  initialCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);

  function handleClick() {
    if (!viewerId) {
      router.push("/login");
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleClick}
          aria-label="Comment"
          title="Comment"
          className="-m-3 rounded-full p-3 text-[var(--ink)] transition-colors hover:bg-[var(--powder-tint)] hover:text-[var(--powder)]"
        >
          <CommentIcon className="h-[22px] w-[22px]" />
        </button>
        <span className="text-sm text-[var(--ink)]">{count}</span>
      </div>

      {open && (
        <CommentModal
          postId={postId}
          viewerId={viewerId}
          viewerUsername={viewerUsername}
          onClose={() => setOpen(false)}
          onCountChange={setCount}
        />
      )}
    </>
  );
}
