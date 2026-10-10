import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase-server";
import { getProfileByUsername } from "@/lib/profiles";
import { getUserPosts } from "@/lib/posts";
import { getFollowCounts, isFollowing } from "@/lib/follows";
import FollowButton from "@/app/components/FollowButton";
import ProfileGrid from "@/app/components/ProfileGrid";
import ProfileHeader from "@/app/components/ProfileHeader";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Checked before any profile-specific query — an unauthenticated visitor
  // is redirected immediately, without spending a Supabase round-trip on a
  // profile lookup that's about to be discarded.
  const user = await getCurrentUser();

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
  // Tagged posts aren't part of the initial visible content — the grid
  // defaults to the Posts tab — so they're loaded client-side only if the
  // Tagged tab is actually selected, rather than blocking this render.
  const [posts, followCounts, alreadyFollowing] = await Promise.all([
    getUserPosts(profile.id, user.id),
    getFollowCounts(profile.id),
    isFollowing(user.id, profile.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10 sm:max-w-3xl sm:px-8 sm:py-14 lg:max-w-4xl xl:max-w-5xl">
      <ProfileHeader
        avatarUrl={avatarUrl}
        username={profile.username}
        displayName={displayName}
        bio={bio}
        postsCount={posts.length}
        followersCount={followCounts.followers}
        followingCount={followCounts.following}
        action={
          <FollowButton
            viewerId={user.id}
            targetUserId={profile.id}
            initialFollowing={alreadyFollowing}
          />
        }
      />

      <ProfileGrid
        posts={posts}
        profileUserId={profile.id}
        viewerId={user.id}
        emptyTitle="No posts yet"
        emptyDescription="When they share photographs, they'll appear here."
      />
    </main>
  );
}
