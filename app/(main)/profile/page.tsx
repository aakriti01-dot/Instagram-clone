import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getUserPosts } from "@/lib/posts";
import { getFollowCounts } from "@/lib/follows";
import ProfileMenu from "@/app/components/ProfileMenu";

// Forces this route to always be rendered fresh on every request — without
// this, a saved edit followed by router.refresh() could still risk showing
// a cached render of the previous profile state.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url")
    .eq("id", user.id)
    .single();

  const username = profile?.username ?? "Unknown";
  const displayName = profile?.display_name ?? null;
  const bio = profile?.bio ?? null;
  const avatarUrl = profile?.avatar_url ?? null;
  const initial = (displayName || username).charAt(0).toUpperCase();
  const [posts, followCounts] = await Promise.all([
    getUserPosts(user.id, user.id),
    getFollowCounts(user.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10 sm:max-w-3xl sm:px-8 sm:py-14">
      <div className="flex items-start gap-5 sm:gap-10">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${username}'s profile picture`}
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
              <p className="text-sm text-[var(--ink-soft)]">@{username}</p>
            </div>
          ) : (
            <p className="font-serif text-xl italic text-[var(--ink)] sm:text-2xl">
              {username}
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

          <Link
            href="/profile/edit"
            className="rounded-full border border-[var(--line)] px-5 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--blush)]"
          >
            Edit profile
          </Link>

          {bio ? (
            <p className="text-sm text-[var(--ink-soft)]">{bio}</p>
          ) : (
            <p className="text-sm text-[var(--ink-soft)] italic">
              No bio yet.
            </p>
          )}
        </div>

        <ProfileMenu />
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
            When you share photographs, they&apos;ll appear here.
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
                alt={`Photo shared by ${username}`}
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
