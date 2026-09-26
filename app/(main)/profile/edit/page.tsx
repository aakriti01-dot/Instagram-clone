import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import EditProfileForm from "@/app/components/EditProfileForm";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10 sm:max-w-xl sm:py-14">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-2xl italic text-[var(--ink)]">
          Edit profile
        </h1>
      </div>
      <EditProfileForm
        userId={user.id}
        initialUsername={profile?.username ?? ""}
        initialDisplayName={profile?.display_name ?? null}
        initialBio={profile?.bio ?? null}
        initialAvatarUrl={profile?.avatar_url ?? null}
      />
    </main>
  );
}
