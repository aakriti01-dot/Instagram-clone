import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getUserPosts } from "@/lib/posts";
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
  const posts = await getUserPosts(user.id);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10 sm:max-w-3xl sm:px-8 sm:py-14">
      <div className="flex items-start gap-5 sm:gap-10">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--powder-tint)] font-serif text-3xl text-[var(--ink)] sm:h-32 sm:w-32 sm:text-5xl">
          {initial}
        </div>

        <div className="flex flex-1 flex-col items-start gap-3 text-left">
          <p className="font-serif text-xl italic text-[var(--ink)] sm:text-2xl">
            {username}
          </p>

          <div className="flex items-center gap-5 text-sm sm:gap-8">
            <p className="text-[var(--ink)]">
              <span className="font-serif font-medium">{posts.length}</span>{" "}
              <span className="text-[var(--ink-soft)]">Posts</span>
            </p>
            <p className="text-[var(--ink)]">
              <span className="font-serif font-medium">0</span>{" "}
              <span className="text-[var(--ink-soft)]">Followers</span>
            </p>
            <p className="text-[var(--ink)]">
              <span className="font-serif font-medium">0</span>{" "}
              <span className="text-[var(--ink-soft)]">Following</span>
            </p>
          </div>

          <button
            type="button"
            className="rounded-full border border-[var(--line)] px-5 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--blush)]"
          >
            Edit profile
          </button>

          <p className="text-sm text-[var(--ink-soft)] italic">
            No bio yet.
          </p>

          <SignOutButton />
        </div>
      </div>

      <div className="mt-10 flex items-center justify-center gap-10 border-t border-[var(--line)] sm:justify-start">
        <span className="-mt-px border-t-2 border-[var(--ink)] pt-3 text-xs font-medium tracking-wide text-[var(--ink)] uppercase">
          Posts
        </span>
        <span className="-mt-px border-t-2 border-transparent pt-3 text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase">
          Tagged
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="font-serif text-xl italic text-[var(--ink)]">
            No posts yet
          </p>
          <p className="max-w-xs text-sm text-[var(--ink-soft)]">
            When you share photographs, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-3 gap-0.5 sm:gap-1">
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-square overflow-hidden bg-[var(--cream)]"
            >
              <Image
                src={post.imageUrl}
                alt={`Photo shared by ${username}`}
                fill
                className="object-cover"
                sizes="(min-width: 640px) 33vw, 33vw"
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
