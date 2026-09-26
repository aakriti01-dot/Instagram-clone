import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-browser";

export type FeedPost = {
  id: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  caption: string | null;
  createdAt: string | null;
  imageUrl: string;
  likeCount: number;
  likedByCurrentUser: boolean;
  commentCount: number;
};

type PostRow = {
  id: number;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string | null;
  profiles: { username: string; avatar_url: string | null } | null;
};

const POST_COLUMNS =
  "id, user_id, image_url, caption, created_at, profiles ( username, avatar_url )";

type LikeRow = {
  post_id: number;
  user_id: string;
};

type CommentCountRow = {
  post_id: number;
};

type BasePost = Omit<
  FeedPost,
  "likeCount" | "likedByCurrentUser" | "commentCount"
>;
type WithLikes = BasePost & {
  likeCount: number;
  likedByCurrentUser: boolean;
};

function mapRow(row: PostRow): BasePost {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.profiles?.username ?? "unknown",
    avatarUrl: row.profiles?.avatar_url ?? null,
    caption: row.caption,
    createdAt: row.created_at,
    imageUrl: row.image_url,
  };
}

// Fetches like data for a set of posts in a single request (not one per
// post), then aggregates counts and current-viewer membership in memory.
async function attachLikeData(
  posts: BasePost[],
  viewerId?: string
): Promise<WithLikes[]> {
  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.id);
  const { data, error } = await supabase
    .from("likes")
    .select("post_id, user_id")
    .in("post_id", postIds);

  if (error) {
    throw error;
  }

  const likeRows = (data ?? []) as LikeRow[];
  const countByPost = new Map<number, number>();
  const likedByViewer = new Set<number>();

  for (const row of likeRows) {
    countByPost.set(row.post_id, (countByPost.get(row.post_id) ?? 0) + 1);
    if (viewerId && row.user_id === viewerId) {
      likedByViewer.add(row.post_id);
    }
  }

  return posts.map((post) => ({
    ...post,
    likeCount: countByPost.get(post.id) ?? 0,
    likedByCurrentUser: likedByViewer.has(post.id),
  }));
}

// Same batching approach for comment counts: one request for all posts on
// the page, not one per post.
async function attachCommentCounts(posts: WithLikes[]): Promise<FeedPost[]> {
  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.id);
  const { data, error } = await supabase
    .from("comments")
    .select("post_id")
    .in("post_id", postIds);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as CommentCountRow[];
  const countByPost = new Map<number, number>();

  for (const row of rows) {
    countByPost.set(row.post_id, (countByPost.get(row.post_id) ?? 0) + 1);
  }

  return posts.map((post) => ({
    ...post,
    commentCount: countByPost.get(post.id) ?? 0,
  }));
}

export async function getFeedPosts(viewerId?: string): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as PostRow[];
  const withLikes = await attachLikeData(rows.map(mapRow), viewerId);
  return attachCommentCounts(withLikes);
}

export async function getUserPosts(
  userId: string,
  viewerId?: string
): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as PostRow[];
  const withLikes = await attachLikeData(rows.map(mapRow), viewerId);
  return attachCommentCounts(withLikes);
}

export async function getPostById(
  postId: number,
  viewerId?: string
): Promise<FeedPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", postId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }

  const row = data as unknown as PostRow;
  const [withLikes] = await attachLikeData([mapRow(row)], viewerId);
  const [withComments] = await attachCommentCounts([withLikes]);
  return withComments;
}

export type DeletePostResult = {
  storageCleanupFailed: boolean;
};

const PUBLIC_POST_IMAGE_MARKER = "/storage/v1/object/public/post-images/";

export async function deletePost(
  postId: number,
  userId: string,
  imageUrl: string
): Promise<DeletePostResult> {
  const browserClient = createClient();
  let storageCleanupFailed = false;

  const markerIndex = imageUrl.indexOf(PUBLIC_POST_IMAGE_MARKER);
  const path =
    markerIndex === -1
      ? null
      : imageUrl.slice(markerIndex + PUBLIC_POST_IMAGE_MARKER.length);

  if (path) {
    const { error: storageError } = await browserClient.storage
      .from("post-images")
      .remove([path]);

    if (storageError) {
      storageCleanupFailed = true;
    }
  } else {
    // Doesn't match the expected convention — nothing safe to derive/delete.
    storageCleanupFailed = true;
  }

  const { error } = await browserClient
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return { storageCleanupFailed };
}
