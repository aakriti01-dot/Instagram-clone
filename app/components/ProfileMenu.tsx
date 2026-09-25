"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { MenuIcon } from "@/app/components/icons";

export default function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Profile menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="text-[var(--ink)] transition-colors hover:text-[var(--blush)]"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)] shadow-[0_4px_16px_rgba(37,35,33,0.08)]">
            <button
              type="button"
              className="block w-full px-4 py-2.5 text-left text-sm text-[var(--ink)] transition-colors hover:bg-[var(--cream)]"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="block w-full border-t border-[var(--line)] px-4 py-2.5 text-left text-sm text-[var(--ink)] transition-colors hover:bg-[var(--cream)] disabled:opacity-60"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
