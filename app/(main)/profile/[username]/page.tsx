import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase-server";
import { getProfileByUsername } from "@/lib/profiles";
import { getUserPosts, getTaggedPosts } from "@/lib/posts";
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

  // Independent of each other — fetched concurrently instead of one after
  // the other.
  const [user, profile] = await Promise.all([
    getCurrentUser(),
    getProfileByUsername(username),
  ]);

  if (!user) {
    redirect("/login");
  }

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
  const [posts, taggedPosts, followCounts, alreadyFollowing] = await Promise.all([
    getUserPosts(profile.id, user.id),
    getTaggedPosts(profile.id, user.id),
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
        taggedPosts={taggedPosts}
        emptyTitle="No posts yet"
        emptyDescription="When they share photographs, they'll appear here."
      />
    </main>
  );
}
