import { createClient } from "@/lib/supabase-server";
import UserSearch from "@/app/components/UserSearch";

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:max-w-2xl sm:px-6 sm:py-10">
      <UserSearch viewerId={user?.id ?? null} />
    </main>
  );
}
