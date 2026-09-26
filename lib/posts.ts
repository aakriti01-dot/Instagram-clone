import { supabase } from "@/lib/supabase";

export type FeedPost = {
  id: number;
  username: string;
  caption: string | null;
  createdAt: string | null;
  imageUrl: string;
  likeCount: number;
  likedByCurrentUser: boolean;
  commentCount: number;
};

type PostRow = {
  id: number;
  image_url: string;
  caption: string | null;
  created_at: string | null;
  profiles: { username: string } | null;
};

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
    username: row.profiles?.username ?? "unknown",
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
    .select("id, image_url, caption, created_at, profiles ( username )")
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
    .select("id, image_url, caption, created_at, profiles ( username )")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as PostRow[];
  const withLikes = await attachLikeData(rows.map(mapRow), viewerId);
  return attachCommentCounts(withLikes);
}
