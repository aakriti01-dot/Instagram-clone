import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase-server";
import { getPostById } from "@/lib/posts";
import PostCard from "@/app/components/PostCard";

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ comment?: string }>;
}) {
  const { id } = await params;
  const { comment } = await searchParams;
  const postId = Number(id);
  const parsedCommentId = comment ? Number(comment) : undefined;
  const highlightCommentId =
    parsedCommentId !== undefined && Number.isInteger(parsedCommentId)
      ? parsedCommentId
      : undefined;

  if (!Number.isInteger(postId)) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const post = await getPostById(postId, user.id);

  if (!post) {
    notFound();
  }

  const supabase = await createClient();
  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-3 py-4 sm:max-w-xl sm:px-4 sm:py-8">
      <PostCard
        post={post}
        index={0}
        viewerId={user.id}
        viewerUsername={viewerProfile?.username ?? null}
        autoOpenCommentId={highlightCommentId}
      />
    </main>
  );
}
