import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-browser";

export type TaggedUser = {
  id: string;
  username: string;
};

export type FeedPost = {
  id: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  caption: string | null;
  location: string | null;
  createdAt: string | null;
  imageUrl: string;
  likeCount: number;
  likedByCurrentUser: boolean;
  commentCount: number;
  taggedUsers: TaggedUser[];
};

type PostRow = {
  id: number;
  user_id: string;
  image_url: string;
  caption: string | null;
  location: string | null;
  created_at: string | null;
  profiles: { username: string; avatar_url: string | null } | null;
};

const POST_COLUMNS =
  "id, user_id, image_url, caption, location, created_at, profiles ( username, avatar_url )";

type LikeRow = {
  post_id: number;
  user_id: string;
};

type CommentCountRow = {
  post_id: number;
};

type PostTagRow = {
  post_id: number;
  tagged_user: { id: string; username: string } | null;
};

type BasePost = Omit<
  FeedPost,
  "likeCount" | "likedByCurrentUser" | "commentCount" | "taggedUsers"
>;

function mapRow(row: PostRow): BasePost {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.profiles?.username ?? "unknown",
    avatarUrl: row.profiles?.avatar_url ?? null,
    caption: row.caption,
    location: row.location,
    createdAt: row.created_at,
    imageUrl: row.image_url,
  };
}

// Likes/comments/tags embedded directly in the posts query itself (via
// PostgREST's nested-resource syntax) instead of fetched as separate
// follow-up requests. A round-trip to this project measures at ~400ms
// regardless of payload size — that's hosting/network latency, not
// something fixable in application code — so every additional sequential
// round-trip costs a full ~400ms on top. Embedding collapses what used to
// be 2 sequential round-trips (posts, then likes+comments+tags) into 1 for
// the feed, profile, and post-detail reads, which measured ~800ms before
// this change and ~400-450ms after.
type EmbeddedPostRow = PostRow & {
  likes: { user_id: string }[];
  comments: { id: number }[];
  post_tags: { tagged_user: { id: string; username: string } | null }[] | null;
};

const EMBEDDED_COLUMNS_WITH_TAGS =
  POST_COLUMNS +
  ", likes ( user_id ), comments ( id ), post_tags ( tagged_user:profiles!tagged_user_id(id, username) )";

const EMBEDDED_COLUMNS_NO_TAGS =
  POST_COLUMNS + ", likes ( user_id ), comments ( id )";

function mapEmbeddedRow(
  row: EmbeddedPostRow,
  viewerId: string | undefined,
  includeTags: boolean
): FeedPost {
  const taggedUsers: TaggedUser[] = includeTags
    ? (row.post_tags ?? [])
        .map((tag) => tag.tagged_user)
        .filter((user): user is TaggedUser => user !== null)
    : [];

  return {
    ...mapRow(row),
    likeCount: row.likes.length,
    likedByCurrentUser: viewerId
      ? row.likes.some((like) => like.user_id === viewerId)
      : false,
    commentCount: row.comments.length,
    taggedUsers,
  };
}

// Runs the single merged query (posts + likes + comments + tags, one
// round-trip) and falls back to the same query without the post_tags embed
// if that merged query fails for any reason — tags are an additive
// enrichment, not core post data, so a tags-related failure should degrade
// to "no tags shown" rather than breaking the feed/profile/post page.
async function fetchPostsWithEngagement(
  build: (columns: string) => PromiseLike<{ data: unknown; error: unknown }>,
  viewerId?: string
): Promise<FeedPost[]> {
  const primary = await build(EMBEDDED_COLUMNS_WITH_TAGS);

  if (!primary.error) {
    const rows = (primary.data ?? []) as unknown as EmbeddedPostRow[];
    return rows.map((row) => mapEmbeddedRow(row, viewerId, true));
  }

  const fallback = await build(EMBEDDED_COLUMNS_NO_TAGS);

  if (fallback.error) {
    throw fallback.error;
  }

  const rows = (fallback.data ?? []) as unknown as EmbeddedPostRow[];
  return rows.map((row) => mapEmbeddedRow(row, viewerId, false));
}

// Likes, comment counts, and tags are each independent lookups keyed only
// off the post IDs already in hand — none needs another's result — so they
// run as one parallel batch (one round-trip each, concurrently) instead of
// three round-trips back to back.
async function attachEngagementData(
  posts: BasePost[],
  viewerId?: string
): Promise<FeedPost[]> {
  if (posts.length === 0) {
    return [];
  }

  const postIds = posts.map((post) => post.id);

  const [likesResult, commentsResult, tagsResult] = await Promise.all([
    supabase.from("likes").select("post_id, user_id").in("post_id", postIds),
    supabase.from("comments").select("post_id").in("post_id", postIds),
    // Tags are an additive enrichment, not core post data (unlike likes/
    // comments) — if this lookup fails for any reason, including the
    // post_tags table not existing yet in an environment where this
    // migration hasn't been run, posts should still render normally with no
    // tags rather than taking the whole feed/profile/post page down with it.
    supabase
      .from("post_tags")
      .select("post_id, tagged_user:profiles!tagged_user_id(id, username)")
      .in("post_id", postIds),
  ]);

  if (likesResult.error) {
    throw likesResult.error;
  }
  if (commentsResult.error) {
    throw commentsResult.error;
  }

  const likeRows = (likesResult.data ?? []) as LikeRow[];
  const likeCountByPost = new Map<number, number>();
  const likedByViewer = new Set<number>();

  for (const row of likeRows) {
    likeCountByPost.set(row.post_id, (likeCountByPost.get(row.post_id) ?? 0) + 1);
    if (viewerId && row.user_id === viewerId) {
      likedByViewer.add(row.post_id);
    }
  }

  const commentRows = (commentsResult.data ?? []) as CommentCountRow[];
  const commentCountByPost = new Map<number, number>();

  for (const row of commentRows) {
    commentCountByPost.set(
      row.post_id,
      (commentCountByPost.get(row.post_id) ?? 0) + 1
    );
  }

  const taggedByPost = new Map<number, TaggedUser[]>();

  if (!tagsResult.error) {
    const tagRows = (tagsResult.data ?? []) as unknown as PostTagRow[];
    for (const row of tagRows) {
      if (!row.tagged_user) continue;
      const existing = taggedByPost.get(row.post_id) ?? [];
      existing.push(row.tagged_user);
      taggedByPost.set(row.post_id, existing);
    }
  }

  return posts.map((post) => ({
    ...post,
    likeCount: likeCountByPost.get(post.id) ?? 0,
    likedByCurrentUser: likedByViewer.has(post.id),
    commentCount: commentCountByPost.get(post.id) ?? 0,
    taggedUsers: taggedByPost.get(post.id) ?? [],
  }));
}

export async function getFeedPosts(viewerId?: string): Promise<FeedPost[]> {
  return fetchPostsWithEngagement(
    (columns) =>
      supabase.from("posts").select(columns).order("created_at", { ascending: false }),
    viewerId
  );
}

export async function getUserPosts(
  userId: string,
  viewerId?: string
): Promise<FeedPost[]> {
  return fetchPostsWithEngagement(
    (columns) =>
      supabase
        .from("posts")
        .select(columns)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    viewerId
  );
}

// For the profile "Tagged" tab — posts where this user appears in post_tags,
// not posts they authored. Reuses the exact same FeedPost pipeline so the
// grid can render it identically to the "Posts" tab.
export async function getTaggedPosts(
  userId: string,
  viewerId?: string
): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`${POST_COLUMNS}, post_tags!inner(tagged_user_id)`)
    .eq("post_tags.tagged_user_id", userId)
    .order("created_at", { ascending: false });

  // Same reasoning as attachTaggedUsers: this entire query depends on
  // post_tags existing. Before that migration runs (or if it ever fails for
  // any other reason), the Tagged tab should just show its empty state
  // rather than breaking the whole profile page.
  if (error) {
    return [];
  }

  const rows = (data ?? []) as unknown as PostRow[];
  return attachEngagementData(rows.map(mapRow), viewerId);
}

export async function getPostById(
  postId: number,
  viewerId?: string
): Promise<FeedPost | null> {
  const primary = await supabase
    .from("posts")
    .select(EMBEDDED_COLUMNS_WITH_TAGS)
    .eq("id", postId)
    .maybeSingle();

  if (!primary.error) {
    if (!primary.data) {
      return null;
    }
    return mapEmbeddedRow(primary.data as unknown as EmbeddedPostRow, viewerId, true);
  }

  const fallback = await supabase
    .from("posts")
    .select(EMBEDDED_COLUMNS_NO_TAGS)
    .eq("id", postId)
    .maybeSingle();

  if (fallback.error) {
    throw fallback.error;
  }
  if (!fallback.data) {
    return null;
  }

  return mapEmbeddedRow(fallback.data as unknown as EmbeddedPostRow, viewerId, false);
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
