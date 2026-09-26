import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getPostById } from "@/lib/posts";
import PostCard from "@/app/components/PostCard";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);

  if (!Number.isInteger(postId)) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const post = await getPostById(postId, user.id);

  if (!post) {
    notFound();
  }

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-lg flex-1 sm:max-w-xl sm:px-4 sm:py-8">
      <PostCard
        post={post}
        index={0}
        viewerId={user.id}
        viewerUsername={viewerProfile?.username ?? null}
      />
    </main>
  );
}
