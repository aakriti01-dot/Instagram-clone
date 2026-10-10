import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase-server";
import CreatePostForm from "@/app/components/CreatePostForm";

export default async function CreatePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10 sm:max-w-xl sm:py-14 lg:max-w-2xl">
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
