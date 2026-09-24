import PostCard from "@/app/components/PostCard";
import { getFeedPosts } from "@/lib/posts";

export default async function Home() {
  const posts = await getFeedPosts();

  return (
    <main className="mx-auto w-full max-w-lg flex-1 sm:max-w-xl sm:px-4 sm:py-8">
      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-28 text-center">
          <span className="font-serif text-2xl italic text-[var(--ink)]">
            Nothing here yet
          </span>
          <p className="max-w-xs text-sm text-[var(--ink-soft)]">
            When photographs are shared, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-0 sm:gap-6">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>
      )}
    </main>
  );
}
