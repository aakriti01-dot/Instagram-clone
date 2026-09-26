import { createClient } from "@/lib/supabase-browser";
import { generateId } from "@/lib/uuid";

export type ProfileUpdate = {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

// Unique per-user path so different users can never overwrite each
// other's files — same convention already used for post-image uploads.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${userId}/${generateId()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-pictures")
    .upload(path, file);

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("profile-pictures").getPublicUrl(path);

  return publicUrl;
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username: updates.username,
      display_name: updates.displayName,
      bio: updates.bio,
      avatar_url: updates.avatarUrl,
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}
