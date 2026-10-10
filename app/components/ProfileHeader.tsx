import type { ReactNode } from "react";

export default function ProfileHeader({
  avatarUrl,
  username,
  displayName,
  bio,
  postsCount,
  followersCount,
  followingCount,
  action,
}: {
  avatarUrl: string | null;
  username: string;
  displayName: string | null;
  bio: string | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  action: ReactNode;
}) {
  const initial = (displayName || username).charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-12">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${username}'s profile picture`}
          className="h-20 w-20 shrink-0 rounded-full object-cover sm:h-36 sm:w-36"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--powder-tint)] font-serif text-3xl text-[var(--ink)] sm:h-36 sm:w-36 sm:text-5xl">
          {initial}
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-serif text-xl italic text-[var(--ink)] sm:text-2xl">
            {username}
          </h1>
          {action}
        </div>

        <div className="flex items-center gap-6 text-sm sm:gap-10">
          <p className="text-[var(--ink)]">
            <span className="font-serif text-base font-medium sm:text-lg">
              {postsCount}
            </span>{" "}
            <span className="text-[var(--ink-soft)]">Posts</span>
          </p>
          <p className="text-[var(--ink)]">
            <span className="font-serif text-base font-medium sm:text-lg">
              {followersCount}
            </span>{" "}
            <span className="text-[var(--ink-soft)]">Followers</span>
          </p>
          <p className="text-[var(--ink)]">
            <span className="font-serif text-base font-medium sm:text-lg">
              {followingCount}
            </span>{" "}
            <span className="text-[var(--ink-soft)]">Following</span>
          </p>
        </div>

        <div className="flex flex-col gap-0.5">
          {displayName && (
            <p className="text-sm font-medium text-[var(--ink)]">
              {displayName}
            </p>
          )}
          {bio ? (
            <p className="text-sm text-[var(--ink-soft)]">{bio}</p>
          ) : (
            <p className="text-sm text-[var(--ink-soft)] italic">
              No bio yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
