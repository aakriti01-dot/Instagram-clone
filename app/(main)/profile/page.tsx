import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import SignOutButton from "@/app/components/SignOutButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const username = profile?.username ?? "Unknown";
  const initial = username.charAt(0).toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-6 px-6 py-16 text-center sm:max-w-xl">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--powder-tint)] font-serif text-3xl text-[var(--ink)]">
        {initial}
      </div>
      <div>
        <p className="font-serif text-2xl italic text-[var(--ink)]">
          {username}
        </p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{user.email}</p>
      </div>
      <SignOutButton />
    </main>
  );
}
