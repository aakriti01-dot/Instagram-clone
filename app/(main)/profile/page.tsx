import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { getUserPosts, getTaggedPosts } from "@/lib/posts";
import { getFollowCounts } from "@/lib/follows";
import ProfileMenu from "@/app/components/ProfileMenu";
import ProfileGrid from "@/app/components/ProfileGrid";
import ProfileHeader from "@/app/components/ProfileHeader";

// Forces this route to always be rendered fresh on every request — without
// this, a saved edit followed by router.refresh() could still risk showing
// a cached render of the previous profile state.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

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
  const [posts, taggedPosts, followCounts] = await Promise.all([
    getUserPosts(user.id, user.id),
    getTaggedPosts(user.id, user.id),
    getFollowCounts(user.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10 sm:max-w-3xl sm:px-8 sm:py-14 lg:max-w-4xl xl:max-w-5xl">
      <ProfileHeader
        avatarUrl={avatarUrl}
        username={username}
        displayName={displayName}
        bio={bio}
        postsCount={posts.length}
        followersCount={followCounts.followers}
        followingCount={followCounts.following}
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/profile/edit"
              className="rounded-full border border-[var(--line)] px-5 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--blush)]"
            >
              Edit profile
            </Link>
            <ProfileMenu />
          </div>
        }
      />

      <ProfileGrid
        posts={posts}
        taggedPosts={taggedPosts}
        emptyTitle="No posts yet"
        emptyDescription="When you share photographs, they'll appear here."
      />
    </main>
  );
}
