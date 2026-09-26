import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase-browser";

export type Comment = {
  id: number;
  postId: number;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
};

type CommentRow = {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { username: string } | null;
};

function mapCommentRow(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    username: row.profiles?.username ?? "unknown",
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function getPostComments(postId: number): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, user_id, content, created_at, profiles ( username )")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as CommentRow[];
  return rows.map(mapCommentRow);
}

// Returns only what the caller doesn't already know (id + created_at from
// the database), so the full Comment can be assembled client-side without
// a second round-trip.
export async function addComment(
  postId: number,
  userId: string,
  content: string
): Promise<{ id: number; createdAt: string }> {
  const browserClient = createClient();
  const { data, error } = await browserClient
    .from("comments")
    .insert({ post_id: postId, user_id: userId, content })
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
