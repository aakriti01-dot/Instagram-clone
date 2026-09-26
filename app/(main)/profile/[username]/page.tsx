import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getProfileByUsername } from "@/lib/profiles";
import { getUserPosts } from "@/lib/posts";
import { getFollowCounts, isFollowing } from "@/lib/follows";
import FollowButton from "@/app/components/FollowButton";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  // /profile/[username] is only for viewing someone else's profile — the
  // canonical URL for your own profile is /profile.
  if (profile.id === user.id) {
    redirect("/profile");
  }

  const displayName = profile.displayName;
  const bio = profile.bio;
  const avatarUrl = profile.avatarUrl;
  const initial = (displayName || profile.username).charAt(0).toUpperCase();
  const [posts, followCounts, alreadyFollowing] = await Promise.all([
    getUserPosts(profile.id, user.id),
    getFollowCounts(profile.id),
    isFollowing(user.id, profile.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10 sm:max-w-3xl sm:px-8 sm:py-14">
      <div className="flex items-start gap-5 sm:gap-10">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${profile.username}'s profile picture`}
            className="h-20 w-20 shrink-0 rounded-full object-cover sm:h-32 sm:w-32"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--powder-tint)] font-serif text-3xl text-[var(--ink)] sm:h-32 sm:w-32 sm:text-5xl">
            {initial}
          </div>
        )}

        <div className="flex flex-1 flex-col items-start gap-3 text-left">
          {displayName ? (
            <div>
              <p className="font-serif text-xl italic text-[var(--ink)] sm:text-2xl">
                {displayName}
              </p>
              <p className="text-sm text-[var(--ink-soft)]">
                @{profile.username}
              </p>
            </div>
          ) : (
            <p className="font-serif text-xl italic text-[var(--ink)] sm:text-2xl">
              {profile.username}
            </p>
          )}

          <div className="flex items-center gap-5 text-sm sm:gap-8">
            <p className="text-[var(--ink)]">
              <span className="font-serif font-medium">{posts.length}</span>{" "}
              <span className="text-[var(--ink-soft)]">Posts</span>
            </p>
            <p className="text-[var(--ink)]">
              <span className="font-serif font-medium">
                {followCounts.followers}
              </span>{" "}
              <span className="text-[var(--ink-soft)]">Followers</span>
            </p>
            <p className="text-[var(--ink)]">
              <span className="font-serif font-medium">
                {followCounts.following}
              </span>{" "}
              <span className="text-[var(--ink-soft)]">Following</span>
            </p>
          </div>

          <FollowButton
            viewerId={user.id}
            targetUserId={profile.id}
            initialFollowing={alreadyFollowing}
          />

          {bio ? (
            <p className="text-sm text-[var(--ink-soft)]">{bio}</p>
          ) : (
            <p className="text-sm text-[var(--ink-soft)] italic">
              No bio yet.
            </p>
          )}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center gap-10 border-t border-[var(--line)] sm:justify-start">
        <span className="-mt-px border-t-2 border-[var(--ink)] pt-3 text-xs font-medium tracking-wide text-[var(--ink)] uppercase">
          Posts
        </span>
        <span className="-mt-px border-t-2 border-transparent pt-3 text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase">
          Tagged
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="font-serif text-xl italic text-[var(--ink)]">
            No posts yet
          </p>
          <p className="max-w-xs text-sm text-[var(--ink-soft)]">
            When they share photographs, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-3 gap-0.5 sm:gap-1">
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-square overflow-hidden bg-[var(--cream)]"
            >
              <Image
                src={post.imageUrl}
                alt={`Photo shared by ${profile.username}`}
                fill
                className="object-cover"
                sizes="(min-width: 640px) 33vw, 33vw"
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
