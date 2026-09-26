import type { ReactNode } from "react";
import Link from "next/link";
import BottomNav from "@/app/components/BottomNav";
import HeaderSearch from "@/app/components/HeaderSearch";
import { createClient } from "@/lib/supabase-server";
import { getActivity } from "@/lib/notifications";
import {
  HeartIcon,
  HomeIcon,
  PlusSquareIcon,
  UserIcon,
} from "@/app/components/icons";

const iconLinkClassName =
  "relative text-[var(--ink)] transition-colors hover:text-[var(--blush)]";

async function getUnreadActivityCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | null
): Promise<number> {
  if (!userId) return 0;

  const [activity, profileResult] = await Promise.all([
    getActivity(userId),
    supabase
      .from("profiles")
      .select("last_seen_activity_at")
      .eq("id", userId)
      .single(),
  ]);

  const lastSeen = profileResult.data?.last_seen_activity_at;
  const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : 0;

  return activity.filter(
    (item) => new Date(item.createdAt).getTime() > lastSeenMs
  ).length;
}

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--blush)] px-1 text-[10px] font-medium text-[var(--cream)]">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  const unreadCount = await getUnreadActivityCount(supabase, viewerId);

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--cream)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link
            href="/feed"
            className="shrink-0 font-serif text-2xl italic tracking-tight text-[var(--ink)]"
          >
            FrontierGram
          </Link>

          <div className="hidden flex-1 justify-center px-8 sm:flex">
            <HeaderSearch viewerId={viewerId} />
          </div>

          <div className="hidden shrink-0 items-center gap-5 sm:flex">
            <Link href="/feed" aria-label="Home" className={iconLinkClassName}>
              <HomeIcon className="h-[22px] w-[22px]" />
            </Link>
            <Link
              href="/create"
              aria-label="Create"
              className={iconLinkClassName}
            >
              <PlusSquareIcon className="h-[22px] w-[22px]" />
            </Link>
            <Link
              href="/activity"
              aria-label="Activity"
              className={iconLinkClassName}
            >
              <HeartIcon className="h-[22px] w-[22px]" />
              <NotificationBadge count={unreadCount} />
            </Link>
            <Link
              href="/profile"
              aria-label="Profile"
              className={iconLinkClassName}
            >
              <UserIcon className="h-[22px] w-[22px]" />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-4 sm:hidden">
            <Link
              href="/activity"
              aria-label="Activity"
              className={iconLinkClassName}
            >
              <HeartIcon className="h-[22px] w-[22px]" />
              <NotificationBadge count={unreadCount} />
            </Link>
            <Link
              href="/profile"
              aria-label="Profile"
              className={iconLinkClassName}
            >
              <UserIcon className="h-[22px] w-[22px]" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col pb-20 sm:pb-0">{children}</div>

      <BottomNav unreadCount={unreadCount} />
    </>
  );
}
