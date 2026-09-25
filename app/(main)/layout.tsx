import type { ReactNode } from "react";
import Link from "next/link";
import BottomNav from "@/app/components/BottomNav";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--cream)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center px-4 py-3.5 sm:max-w-xl sm:px-6">
          <Link
            href="/feed"
            className="font-serif text-2xl italic tracking-tight text-[var(--ink)]"
          >
            FrontierGram
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col pb-20 sm:pb-0">{children}</div>

      <BottomNav />
    </>
  );
}
