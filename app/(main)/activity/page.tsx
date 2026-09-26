import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getActivity, type ActivityActor } from "@/lib/notifications";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function actorInitial(actor: ActivityActor) {
  return (actor.displayName || actor.username).charAt(0).toUpperCase();
}

function ActorAvatar({ actor }: { actor: ActivityActor }) {
  return actor.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={actor.avatarUrl}
      alt=""
      className="h-11 w-11 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--powder-tint)] font-serif text-lg text-[var(--ink)]">
      {actorInitial(actor)}
    </div>
  );
}

export default async function ActivityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const activity = await getActivity(user.id);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:max-w-xl sm:px-6 sm:py-8">
      <h1 className="mb-4 font-serif text-2xl italic text-[var(--ink)]">
        Activity
      </h1>

      {activity.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="font-serif text-xl italic text-[var(--ink)]">
            No activity yet
          </p>
          <p className="max-w-xs text-sm text-[var(--ink-soft)]">
            When people follow you or interact with your photographs,
            it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {activity.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0"
            >
              <Link
                href={`/profile/${item.actor.username}`}
                className="shrink-0 transition-opacity hover:opacity-80"
              >
                <ActorAvatar actor={item.actor} />
              </Link>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-[var(--ink)]">
                  <Link
                    href={`/profile/${item.actor.username}`}
                    className="font-medium hover:underline"
                  >
                    {item.actor.username}
                  </Link>{" "}
                  {item.type === "follow" && (
                    <span className="text-[var(--ink-soft)]">
                      started following you
                    </span>
                  )}
                  {item.type === "like" && (
                    <span className="text-[var(--ink-soft)]">
                      liked your post
                    </span>
                  )}
                  {item.type === "comment" && (
                    <span className="truncate text-[var(--ink-soft)]">
                      commented: &ldquo;{item.content}&rdquo;
                    </span>
                  )}
                  {item.type === "reply" && (
                    <span className="truncate text-[var(--ink-soft)]">
                      replied to your comment: &ldquo;{item.content}&rdquo;
                    </span>
                  )}
                </p>
                <time className="text-xs text-[var(--ink-soft)]">
                  {formatRelativeTime(item.createdAt)}
                </time>
              </div>

              {(item.type === "like" ||
                item.type === "comment" ||
                item.type === "reply") && (
                <Link
                  href={`/post/${item.post.id}`}
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[var(--cream)]"
                >
                  <Image
                    src={item.post.imageUrl}
                    alt="Related post"
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
