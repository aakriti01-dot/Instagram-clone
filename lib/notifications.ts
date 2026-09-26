import { supabase } from "@/lib/supabase";

export type ActivityActor = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type ActivityItem =
  | {
      type: "follow";
      id: string;
      createdAt: string;
      actor: ActivityActor;
      alreadyFollowing: boolean;
    }
  | {
      type: "like";
      id: string;
      createdAt: string;
      actor: ActivityActor;
      post: { id: number; imageUrl: string };
    }
  | {
      type: "comment";
      id: string;
      createdAt: string;
      actor: ActivityActor;
      post: { id: number; imageUrl: string };
      content: string;
    }
  | {
      type: "reply";
      id: string;
      createdAt: string;
      actor: ActivityActor;
      post: { id: number; imageUrl: string };
      content: string;
    };

type ProfileEmbed = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
} | null;

function mapActor(profile: ProfileEmbed): ActivityActor {
  return {
    id: profile?.id ?? "",
    username: profile?.username ?? "unknown",
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };
}

type FollowRow = {
  id: number;
  created_at: string;
  follower: ProfileEmbed;
};

type LikeRow = {
  id: number;
  created_at: string;
  user_id: string;
  post: { id: number; image_url: string } | null;
  liker: ProfileEmbed;
};

type CommentRow = {
  id: number;
  created_at: string;
  content: string;
  user_id: string;
  post: { id: number; image_url: string } | null;
  commenter: ProfileEmbed;
};

type ReplyRow = {
  id: number;
  created_at: string;
  content: string;
  user_id: string;
  post: { id: number; image_url: string } | null;
  replier: ProfileEmbed;
};

const ACTIVITY_LIMIT = 50;
const PER_SOURCE_LIMIT = 30;

// Reply notifications go to the owner of the PARENT comment, not the post
// owner — a self-referencing lookup, which PostgREST's embedding can't
// disambiguate cleanly for a self-referential FK (confirmed empirically: a
// `comments!parent_id(...)` embed resolves to "children of this row", not
// "the row this one points to", no matter which hint is used). Resolving it
// as two plain queries instead of fighting that ambiguity: first the ids of
// comments the viewer themselves authored, then any replies to those ids.
async function getReplyItems(viewerId: string): Promise<ActivityItem[]> {
  const { data: ownedComments, error: ownedError } = await supabase
    .from("comments")
    .select("id")
    .eq("user_id", viewerId)
    .is("parent_id", null);

  if (ownedError) throw ownedError;

  const ownedIds = (ownedComments ?? []).map((row) => (row as { id: number }).id);
  if (ownedIds.length === 0) return [];

  const { data, error } = await supabase
    .from("comments")
    .select(
      "id, created_at, content, user_id, post:posts!inner(id, image_url), replier:profiles!user_id(id, username, display_name, avatar_url)"
    )
    .in("parent_id", ownedIds)
    .neq("user_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(PER_SOURCE_LIMIT);

  if (error) throw error;

  const rows = (data ?? []) as unknown as ReplyRow[];
  return rows
    .filter((row) => row.post !== null)
    .map((row) => ({
      type: "reply" as const,
      id: `reply-${row.id}`,
      createdAt: row.created_at,
      actor: mapActor(row.replier),
      post: { id: row.post!.id, imageUrl: row.post!.image_url },
      content: row.content,
    }));
}

// Notifications are derived directly from the existing follows/likes/comments
// tables rather than a dedicated notifications table — there is no write path
// to secure (nothing here is ever inserted), so a stored row can never go out
// of sync with the underlying event, and every case in the spec (deleted
// posts, missing profiles, self-actions) falls out of the query shape itself
// rather than needing separate handling.
export async function getActivity(viewerId: string): Promise<ActivityItem[]> {
  const [followsResult, likesResult, commentsResult, replyItems, myFollowingResult] = await Promise.all([
    supabase
      .from("follows")
      .select("id, created_at, follower:profiles!follower_id(id, username, display_name, avatar_url)")
      .eq("followed_id", viewerId)
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT),
    supabase
      .from("likes")
      .select(
        "id, created_at, user_id, post:posts!inner(id, user_id, image_url), liker:profiles!user_id(id, username, display_name, avatar_url)"
      )
      .eq("post.user_id", viewerId)
      .neq("user_id", viewerId)
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT),
    supabase
      .from("comments")
      .select(
        "id, created_at, content, user_id, post:posts!inner(id, user_id, image_url), commenter:profiles!user_id(id, username, display_name, avatar_url)"
      )
      // Top-level comments only — a reply is a distinct notification type
      // below, going to the parent comment's owner rather than the post
      // owner, so it must not also surface here.
      .is("parent_id", null)
      .eq("post.user_id", viewerId)
      .neq("user_id", viewerId)
      .order("created_at", { ascending: false })
      .limit(PER_SOURCE_LIMIT),
    getReplyItems(viewerId),
    // Batched once, rather than one isFollowing() call per follow
    // notification, so the "Follow Back" button on each can start in the
    // correct state (already mutual vs. not) without an N+1 query pattern.
    supabase.from("follows").select("followed_id").eq("follower_id", viewerId),
  ]);

  if (followsResult.error) throw followsResult.error;
  if (likesResult.error) throw likesResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (myFollowingResult.error) throw myFollowingResult.error;

  const followRows = (followsResult.data ?? []) as unknown as FollowRow[];
  const likeRows = (likesResult.data ?? []) as unknown as LikeRow[];
  const commentRows = (commentsResult.data ?? []) as unknown as CommentRow[];
  const myFollowingIds = new Set(
    (myFollowingResult.data ?? []).map(
      (row) => (row as { followed_id: string }).followed_id
    )
  );

  const followItems: ActivityItem[] = followRows.map((row) => ({
    type: "follow",
    id: `follow-${row.id}`,
    createdAt: row.created_at,
    actor: mapActor(row.follower),
    alreadyFollowing: myFollowingIds.has(row.follower?.id ?? ""),
  }));

  // Defensive de-dupe by (post, liker) in case the same post/user pair is
  // ever represented more than once — keeps one notification per liker.
  const seenLikes = new Set<string>();
  const likeItems: ActivityItem[] = [];
  for (const row of likeRows) {
    if (!row.post) continue;
    const key = `${row.post.id}:${row.user_id}`;
    if (seenLikes.has(key)) continue;
    seenLikes.add(key);
    likeItems.push({
      type: "like",
      id: `like-${row.id}`,
      createdAt: row.created_at,
      actor: mapActor(row.liker),
      post: { id: row.post.id, imageUrl: row.post.image_url },
    });
  }

  const commentItems: ActivityItem[] = commentRows
    .filter((row) => row.post !== null)
    .map((row) => ({
      type: "comment",
      id: `comment-${row.id}`,
      createdAt: row.created_at,
      actor: mapActor(row.commenter),
      post: { id: row.post!.id, imageUrl: row.post!.image_url },
      content: row.content,
    }));

  return [...followItems, ...likeItems, ...commentItems, ...replyItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, ACTIVITY_LIMIT);
}
