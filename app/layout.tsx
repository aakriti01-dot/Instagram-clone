import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import Link from "next/link";
import {
  HeartIcon,
  HomeIcon,
  PlusSquareIcon,
  SearchIcon,
  UserIcon,
} from "@/app/components/icons";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["italic", "normal"],
});

export const metadata: Metadata = {
  title: "Lumio",
  description: "A quieter place for the photos that matter.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--cream)]">
        <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--cream)]/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3.5 sm:max-w-xl sm:px-6">
            <span className="font-serif text-2xl italic tracking-tight text-[var(--ink)]">
              Lumio
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Search"
                className="text-[var(--ink)] transition-colors hover:text-[var(--blush)]"
              >
                <SearchIcon className="h-[22px] w-[22px]" />
              </button>
              <button
                type="button"
                aria-label="Create post"
                className="text-[var(--ink)] transition-colors hover:text-[var(--blush)]"
              >
                <PlusSquareIcon className="h-[22px] w-[22px]" />
              </button>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--powder-tint)] text-[var(--ink)]">
                <UserIcon className="h-4 w-4" />
              </span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col pb-20 sm:pb-0">{children}</div>

        <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--line)] bg-[var(--paper)] sm:hidden">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between px-8 py-3">
            <Link href="/" aria-label="Home" className="text-[var(--ink)]">
              <HomeIcon className="h-6 w-6" />
            </Link>
            <button
              type="button"
              aria-label="Search"
              className="text-[var(--ink-soft)]"
            >
              <SearchIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Create post"
              className="text-[var(--ink-soft)]"
            >
              <PlusSquareIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Activity"
              className="text-[var(--ink-soft)]"
            >
              <HeartIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Profile"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--blush-tint)] text-[var(--ink)]"
            >
              <UserIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </nav>
      </body>
    </html>
  );
}
