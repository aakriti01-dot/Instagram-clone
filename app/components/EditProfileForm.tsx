"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile, uploadAvatar } from "@/lib/profile";

const BIO_LIMIT = 150;

function isPostgrestError(value: unknown): value is { code: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof (value as { code: unknown }).code === "string"
  );
}

export default function EditProfileForm({
  userId,
  initialUsername,
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
}: {
  userId: string;
  initialUsername: string;
  initialDisplayName: string | null;
  initialBio: string | null;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialAvatarUrl
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initial = (displayName || username || "?").charAt(0).toUpperCase();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Username can't be empty.");
      return;
    }

    setSaving(true);

    try {
      let avatarUrl = initialAvatarUrl;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(userId, avatarFile);
      }

      await updateProfile(userId, {
        username: trimmedUsername,
        displayName: displayName.trim() || null,
        bio: bio.trim() || null,
        avatarUrl,
      });

      setUsername(trimmedUsername);
      setSuccess(true);
      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 900);
    } catch (err) {
      setError(
        isPostgrestError(err) && err.code === "23505"
          ? "That username is already taken."
          : "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        {avatarPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarPreview}
            alt="Profile picture preview"
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--powder-tint)] font-serif text-3xl text-[var(--ink)]">
            {initial}
          </div>
        )}
        <label className="cursor-pointer text-sm font-medium text-[var(--blush)] underline underline-offset-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          Change photo
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="displayName"
          className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase"
        >
          Name
        </label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="username"
          className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="bio"
            className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase"
          >
            Bio
          </label>
          <span className="text-xs text-[var(--ink-soft)]">
            {bio.length}/{BIO_LIMIT}
          </span>
        </div>
        <textarea
          id="bio"
          rows={3}
          maxLength={BIO_LIMIT}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className="resize-none rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--blush)] bg-[var(--blush-tint)] px-3.5 py-2.5 text-sm text-[var(--ink)]">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-[var(--powder)] bg-[var(--powder-tint)] px-3.5 py-2.5 text-sm text-[var(--ink)]">
          Profile updated.
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--cream)] transition-opacity disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <Link
          href="/profile"
          className="text-sm text-[var(--ink-soft)] underline underline-offset-2"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
