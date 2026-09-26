"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { followUser, unfollowUser } from "@/lib/follows";

export default function FollowButton({
  viewerId,
  targetUserId,
  initialFollowing,
}: {
  viewerId: string | null;
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!viewerId) {
      router.push("/login");
      return;
    }
    if (pending) return;

    const previousFollowing = following;
    const nextFollowing = !following;

    setError(null);
    setFollowing(nextFollowing);
    setPending(true);

    try {
      if (nextFollowing) {
        await followUser(viewerId, targetUserId);
      } else {
        await unfollowUser(viewerId, targetUserId);
      }
    } catch {
      setFollowing(previousFollowing);
      setError("Couldn't update. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={following}
        className={
          following
            ? "rounded-full border border-[var(--line)] px-5 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--blush)] disabled:opacity-60"
            : "rounded-full bg-[var(--ink)] px-5 py-2 text-sm font-medium text-[var(--cream)] transition-opacity disabled:opacity-60"
        }
      >
        {following ? "Following" : "Follow"}
      </button>
      {error && (
        <span className="text-xs text-[var(--ink-soft)]">{error}</span>
      )}
    </div>
  );
}
