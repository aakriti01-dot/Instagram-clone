import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import CreatePostForm from "@/app/components/CreatePostForm";

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10 sm:max-w-xl sm:py-14">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-2xl italic text-[var(--ink)]">
          New post
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Share a photograph with FrontierGram.
        </p>
      </div>
      <CreatePostForm userId={user.id} />
    </main>
  );
}
