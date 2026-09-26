import { supabase } from "@/lib/supabase";

export type FeedPost = {
  id: number;
  username: string;
  caption: string | null;
  createdAt: string | null;
  imageUrl: string;
};

type PostRow = {
  id: number;
  image_url: string;
  caption: string | null;
  created_at: string | null;
  profiles: { username: string } | null;
};

function mapRow(row: PostRow): FeedPost {
  return {
    id: row.id,
    username: row.profiles?.username ?? "unknown",
    caption: row.caption,
    createdAt: row.created_at,
    imageUrl: row.image_url,
  };
}

export async function getFeedPosts(): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, image_url, caption, created_at, profiles ( username )")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as PostRow[];
  return rows.map(mapRow);
}

export async function getUserPosts(userId: string): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, image_url, caption, created_at, profiles ( username )")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as PostRow[];
  return rows.map(mapRow);
}
