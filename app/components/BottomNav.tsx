"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartIcon,
  HomeIcon,
  PlusSquareIcon,
  SearchIcon,
  UserIcon,
} from "@/app/components/icons";

const NAV_ITEMS = [
  { href: "/feed", label: "Home", Icon: HomeIcon },
  { href: "/search", label: "Search", Icon: SearchIcon },
  { href: "/create", label: "Create", Icon: PlusSquareIcon },
  { href: "/activity", label: "Activity", Icon: HeartIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
] as const;

export default function BottomNav({
  unreadCount = 0,
}: {
  unreadCount?: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--line)] bg-[var(--paper)] sm:hidden">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between px-8 py-3">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          const showBadge = href === "/activity" && unreadCount > 0;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`relative ${
                active
                  ? "text-[var(--ink)]"
                  : "text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
              }`}
            >
              <Icon className="h-6 w-6" />
              {showBadge && (
                <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--blush)] px-1 text-[10px] font-medium text-[var(--cream)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <span
                className={`mx-auto mt-1 block h-1 w-1 rounded-full ${
                  active ? "bg-[var(--blush)]" : "bg-transparent"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
