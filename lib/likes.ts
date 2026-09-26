import { createClient } from "@/lib/supabase-browser";

export async function likePost(postId: number, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("likes")
    .insert({ post_id: postId, user_id: userId });

  if (error) {
    throw error;
  }
}

export async function unlikePost(
  postId: number,
  userId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}
