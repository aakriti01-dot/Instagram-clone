"use client";

import { useState } from "react";
import { TagIcon } from "@/app/components/icons";
import TagPeopleModal from "@/app/components/TagPeopleModal";
import type { TaggedUser } from "@/lib/posts";

export default function TagPeopleButton({
  postId,
  viewerId,
  isOwner,
  initialTaggedUsers,
}: {
  postId: number;
  viewerId: string | null;
  isOwner: boolean;
  initialTaggedUsers: TaggedUser[];
}) {
  const [open, setOpen] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState(initialTaggedUsers);

  // Non-owners can't tag/untag (enforced server-side by RLS regardless), and
  // they already see who's tagged as plain text under the caption — so there
  // is nothing for this control to do for them. Omitting it entirely keeps
  // the action row honest about what's actually clickable, rather than
  // showing a read-only icon that opens a half-empty "add" modal they can't
  // use.
  if (!isOwner || !viewerId) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Tag people"
        title="Tag people"
        className="text-[var(--ink)] transition-colors hover:text-[var(--blush)]"
      >
        <TagIcon className="h-[22px] w-[22px]" />
      </button>

      {open && (
        <TagPeopleModal
          postId={postId}
          viewerId={viewerId}
          taggedUsers={taggedUsers}
          onClose={() => setOpen(false)}
          onTagsChange={setTaggedUsers}
        />
      )}
    </>
  );
}
