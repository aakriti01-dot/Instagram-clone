import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-browser";

export async function followUser(
  followerId: string,
  followedId: string
): Promise<void> {
  if (followerId === followedId) {
    throw new Error("You can't follow yourself.");
  }

  const browserClient = createClient();
  const { error } = await browserClient
    .from("follows")
    .insert({ follower_id: followerId, followed_id: followedId });

  // A unique-violation means the follow already exists — the desired end
  // state is already true, so this isn't treated as a real failure.
  if (error && error.code !== "23505") {
    throw error;
  }
}

export async function unfollowUser(
  followerId: string,
  followedId: string
): Promise<void> {
  const browserClient = createClient();
  const { error } = await browserClient
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("followed_id", followedId);

  if (error) {
    throw error;
  }
  // Deleting zero matching rows (relationship never existed) is not an
  // error from PostgREST — the desired end state is already true.
}

export async function isFollowing(
  followerId: string,
  followedId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("followed_id", followedId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
}

export type FollowCounts = {
  followers: number;
  following: number;
};

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const [followersResult, followingResult] = await Promise.all([
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("followed_id", userId),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);

  if (followersResult.error) {
    throw followersResult.error;
  }
  if (followingResult.error) {
    throw followingResult.error;
  }

  return {
    followers: followersResult.count ?? 0,
    following: followingResult.count ?? 0,
  };
}
