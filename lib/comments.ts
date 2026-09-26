import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-browser";

export type Comment = {
  id: number;
  postId: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
  parentId: number | null;
};

export type ThreadedComment = Comment & { replies: Comment[] };

type CommentRow = {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: number | null;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

const COMMENT_COLUMNS =
  "id, post_id, user_id, content, created_at, parent_id, profiles ( username, display_name, avatar_url )";

function mapCommentRow(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    username: row.profiles?.username ?? "unknown",
    displayName: row.profiles?.display_name ?? null,
    avatarUrl: row.profiles?.avatar_url ?? null,
    content: row.content,
    createdAt: row.created_at,
    parentId: row.parent_id,
  };
}

export async function getPostComments(postId: number): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_COLUMNS)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as CommentRow[];
  return rows.map(mapCommentRow);
}

// Groups a flat, chronologically-ordered comment list into top-level
// comments with their direct replies nested underneath. Only one level of
// nesting is supported by design (a reply to a reply is shown as its own
// top-level item rather than silently dropped), matching the two-level
// comment/reply structure this feature is scoped to.
export function buildCommentTree(comments: Comment[]): ThreadedComment[] {
  const topLevel: ThreadedComment[] = [];
  const byId = new Map<number, ThreadedComment>();

  for (const comment of comments) {
    if (comment.parentId === null) {
      const node: ThreadedComment = { ...comment, replies: [] };
      byId.set(comment.id, node);
      topLevel.push(node);
    }
  }

  for (const comment of comments) {
    if (comment.parentId === null) continue;
    const parent = byId.get(comment.parentId);
    if (parent) {
      parent.replies.push(comment);
    } else {
      topLevel.push({ ...comment, replies: [] });
    }
  }

  return topLevel;
}

// Returns only what the caller doesn't already know (id + created_at from
// the database), so the full Comment can be assembled client-side without
// a second round-trip. Pass parentId to post a reply instead of a top-level
// comment.
export async function addComment(
  postId: number,
  userId: string,
  content: string,
  parentId?: number | null
): Promise<{ id: number; createdAt: string }> {
  const browserClient = createClient();
  const { data, error } = await browserClient
    .from("comments")
    .insert({
      post_id: postId,
      user_id: userId,
      content,
      parent_id: parentId ?? null,
    })
    .select("id, created_at")
    .single();

  if (error) {
    throw error;
  }

  return { id: data.id, createdAt: data.created_at };
}

export async function deleteComment(
  commentId: number,
  userId: string
): Promise<void> {
  const browserClient = createClient();
  const { error } = await browserClient
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
