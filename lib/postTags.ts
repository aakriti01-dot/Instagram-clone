import { createClient } from "@/lib/supabase-browser";

// Who's allowed to call these is enforced by RLS on post_tags, not here:
// INSERT is restricted to the post's owner, DELETE to the post's owner or
// the tagged user themselves. These functions don't re-check ownership
// client-side — a mismatched caller gets a real database error, not a
// silently-ignored no-op.

export async function tagUsers(
  postId: number,
  userIds: string[]
): Promise<void> {
  if (userIds.length === 0) return;

  const browserClient = createClient();
  const rows = userIds.map((taggedUserId) => ({
    post_id: postId,
    tagged_user_id: taggedUserId,
  }));

  const { error } = await browserClient.from("post_tags").insert(rows);

  // A unique-violation means that user is already tagged on this post — the
  // desired end state is already true, so this isn't treated as a failure.
  if (error && error.code !== "23505") {
    throw error;
  }
}

export async function untagUser(
  postId: number,
  taggedUserId: string
): Promise<void> {
  const browserClient = createClient();
  const { error } = await browserClient
    .from("post_tags")
    .delete()
    .eq("post_id", postId)
    .eq("tagged_user_id", taggedUserId);

  if (error) {
    throw error;
  }
  // Deleting zero matching rows (tag never existed) is not an error from
  // PostgREST — the desired end state is already true.
}
