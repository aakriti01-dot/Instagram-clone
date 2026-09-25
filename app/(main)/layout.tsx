import type { ReactNode } from "react";
import Link from "next/link";
import BottomNav from "@/app/components/BottomNav";
import {
  HeartIcon,
  HomeIcon,
  PlusSquareIcon,
  SearchIcon,
  UserIcon,
} from "@/app/components/icons";

const iconLinkClassName =
  "text-[var(--ink)] transition-colors hover:text-[var(--blush)]";

export default function MainLayout({ children }: { children: ReactNode }) {
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
            <div className="flex w-full max-w-xs items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-[var(--ink-soft)]">
              <SearchIcon className="h-4 w-4 shrink-0" />
              <span className="text-sm">Search</span>
            </div>
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

      <BottomNav />
    </>
  );
}
