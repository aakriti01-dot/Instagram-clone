import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

const PROFILE_COLUMNS = "id, username, display_name, bio, avatar_url, created_at";

function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  };
}

export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .ilike("username", username)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfileRow(data as ProfileRow) : null;
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfileRow(data as ProfileRow) : null;
}

export async function searchProfiles(
  query: string,
  excludeUserId?: string
): Promise<Profile[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  let request = supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .ilike("username", `%${trimmed}%`)
    .order("username", { ascending: true })
    .limit(20);

  if (excludeUserId) {
    request = request.neq("id", excludeUserId);
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ProfileRow[];
  return rows.map(mapProfileRow);
}
