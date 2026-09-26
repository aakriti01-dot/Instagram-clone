"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon } from "@/app/components/icons";
import { likePost, unlikePost } from "@/lib/likes";

const POP_DURATION_MS = 320;
const COUNT_PULSE_DURATION_MS = 300;

export default function LikeButton({
  postId,
  viewerId,
  initialLiked,
  initialCount,
}: {
  postId: number;
  viewerId: string | null;
  initialLiked: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const [countPulse, setCountPulse] = useState(false);

  const popTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (popTimeout.current) clearTimeout(popTimeout.current);
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
    };
  }, []);

  async function handleClick() {
    if (!viewerId) {
      router.push("/login");
      return;
    }
    if (pending) return;

    const previousLiked = liked;
    const previousCount = count;
    const nextLiked = !liked;

    setError(null);
    setLiked(nextLiked);
    setCount(previousCount + (nextLiked ? 1 : -1));
    setPending(true);

    // Heart pop plays only on liking (not unliking); the count highlight
    // plays either way, since the count itself changed.
    if (nextLiked) {
      setJustLiked(true);
      if (popTimeout.current) clearTimeout(popTimeout.current);
      popTimeout.current = setTimeout(
        () => setJustLiked(false),
        POP_DURATION_MS
      );
    }
    setCountPulse(true);
    if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
    pulseTimeout.current = setTimeout(
      () => setCountPulse(false),
      COUNT_PULSE_DURATION_MS
    );

    try {
      if (nextLiked) {
        await likePost(postId, viewerId);
      } else {
        await unlikePost(postId, viewerId);
      }
    } catch {
      setLiked(previousLiked);
      setCount(previousCount);
      setError("Couldn't update. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        aria-label={liked ? "Unlike" : "Like"}
        title={liked ? "Unlike" : "Like"}
        aria-pressed={liked}
        className={`-m-3 rounded-full p-3 transition-colors hover:bg-[var(--blush-tint)] ${
          liked
            ? "text-[var(--blush)]"
            : "text-[var(--ink)] hover:text-[var(--blush)]"
        }`}
      >
        <HeartIcon
          className={`h-[22px] w-[22px] ${
            justLiked
              ? "animate-[heart-pop_320ms_ease-out] motion-reduce:animate-none"
              : ""
          }`}
          filled={liked}
        />
      </button>
      <span
        className={`text-sm transition-colors duration-300 ${
          countPulse ? "text-[var(--blush)]" : "text-[var(--ink)]"
        }`}
      >
        {count}
      </span>
      {error && (
        <span className="text-xs text-[var(--ink-soft)]">{error}</span>
      )}
    </div>
  );
}
