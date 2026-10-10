"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { generateId } from "@/lib/uuid";
import { PlusSquareIcon, CloseIcon, LocationPinIcon } from "@/app/components/icons";
import { searchProfiles, type Profile } from "@/lib/profiles";
import { tagUsers } from "@/lib/postTags";
import Spinner from "@/app/components/Spinner";

const TAG_DEBOUNCE_MS = 300;
const TAG_FAILURE_NOTICE_MS = 1800;
const MAX_LOCATION_LENGTH = 100;

// HEIC/HEIF (the default photo format on iPhone) decodes fine in Safari but
// not in Chrome/Firefox/Edge's <img> — a post uploaded from one would look
// fine to its own author and silently fail to render for almost everyone
// else. file.type is unreliable here (many browsers report "" for HEIC), so
// the extension is the signal actually worth trusting.
const UNSUPPORTED_EXTENSIONS = ["heic", "heif"];

function isUnsupportedHeicFile(file: File): boolean {
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : undefined;

  return (
    UNSUPPORTED_EXTENSIONS.includes(extension ?? "") ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  );
}

// Camera photos routinely run 10-15MP, far more than any screen will ever
// display this image at — uploading that unchanged costs the user upload
// time and bandwidth for resolution nobody downstream benefits from.
// Downscaling to this cap keeps photos sharp at any size they're actually
// shown at (the full-width post view is capped at 672px) while cutting
// typical upload size dramatically.
const MAX_UPLOAD_DIMENSION = 2048;
const RESIZE_JPEG_QUALITY = 0.9;

async function resizeImageIfNeeded(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    if (width <= MAX_UPLOAD_DIMENSION && height <= MAX_UPLOAD_DIMENSION) {
      bitmap.close();
      return file;
    }

    const scale = MAX_UPLOAD_DIMENSION / Math.max(width, height);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", RESIZE_JPEG_QUALITY)
    );

    if (!blob) {
      return file;
    }

    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    // Resizing is an optimization, not a requirement — if it fails for any
    // reason, uploading the original file is always safe to fall back to.
    return file;
  }
}

export default function CreatePostForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const [tagResults, setTagResults] = useState<Profile[]>([]);
  const [tagSearching, setTagSearching] = useState(false);
  const [tagSearchError, setTagSearchError] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Profile[]>([]);

  function handleTagQueryChange(value: string) {
    setTagQuery(value);
    if (!value.trim()) {
      setTagResults([]);
      setTagSearching(false);
      setTagSearchError(false);
    } else {
      setTagSearching(true);
      setTagSearchError(false);
    }
  }

  useEffect(() => {
    const trimmed = tagQuery.trim();
    if (!trimmed) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      searchProfiles(trimmed, userId)
        .then((data) => {
          if (cancelled) return;
          const selectedIds = new Set(selectedTags.map((p) => p.id));
          setTagResults(data.filter((p) => !selectedIds.has(p.id)));
        })
        .catch(() => {
          if (cancelled) return;
          setTagResults([]);
          setTagSearchError(true);
        })
        .finally(() => {
          if (!cancelled) setTagSearching(false);
        });
    }, TAG_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [tagQuery, userId, selectedTags]);

  function addTag(profile: Profile) {
    setSelectedTags((prev) => [...prev, profile]);
    setTagQuery("");
    setTagResults([]);
  }

  function removeTag(profileId: string) {
    setSelectedTags((prev) => prev.filter((p) => p.id !== profileId));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError(null);

    if (selected && isUnsupportedHeicFile(selected)) {
      setFile(null);
      setPreviewUrl(null);
      setError(
        "HEIC photos aren't supported yet — most browsers can't display them. Please choose a JPEG or PNG, or set your iPhone's camera to \"Most Compatible\" under Settings > Camera > Formats."
      );
      event.target.value = "";
      return;
    }

    setFile(selected);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : null);
  }

  function handleReset() {
    setFile(null);
    setPreviewUrl(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Choose a photo to share.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const uploadFile = await resizeImageIfNeeded(file);

      const extension = uploadFile.name.includes(".")
        ? uploadFile.name.split(".").pop()
        : "jpg";
      const path = `${userId}/${generateId()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, uploadFile);

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(path);

      const { data: insertedPost, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          image_url: publicUrl,
          caption: caption.trim() || null,
          location: location.trim() || null,
        })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      let tagsFailed = false;

      if (selectedTags.length > 0 && insertedPost) {
        try {
          await tagUsers(
            insertedPost.id,
            selectedTags.map((profile) => profile.id)
          );
        } catch (tagError) {
          // The post itself succeeded, which is the primary action — a
          // tagging failure here is secondary and shouldn't block the user,
          // same convention as deletePost's storageCleanupFailed. It's still
          // worth a brief, non-blocking notice before navigating away, since
          // the post will otherwise silently end up untagged.
          console.warn("Couldn't save post tags:", tagError);
          tagsFailed = true;
        }
      }

      if (tagsFailed) {
        setError(
          "Post shared, but tags couldn't be saved. You can add them from the post."
        );
        // The button re-enables once `loading` clears in `finally` below —
        // this keeps it disabled through the delay too, so the brief window
        // before navigating away can't be used to submit a second post.
        setRedirecting(true);
        setTimeout(() => {
          router.push("/feed");
          router.refresh();
        }, TAG_FAILURE_NOTICE_MS);
      } else {
        router.push("/feed");
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {previewUrl ? (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[var(--cream)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Selected preview"
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="self-start text-sm text-[var(--ink-soft)] underline underline-offset-2"
          >
            Choose a different photo
          </button>
        </div>
      ) : (
        <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)] transition-colors hover:border-[var(--blush)]">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <PlusSquareIcon className="h-8 w-8" />
          <span className="text-sm">Choose a photo</span>
        </label>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="caption"
          className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase"
        >
          Caption
        </label>
        <textarea
          id="caption"
          rows={3}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Say something about this photograph…"
          className="resize-none rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="location"
          className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase"
        >
          Add location (optional)
        </label>
        <div className="relative">
          <LocationPinIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-soft)]" />
          <input
            id="location"
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Kathmandu, a restaurant, a landmark…"
            maxLength={MAX_LOCATION_LENGTH}
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--paper)] py-2.5 pr-9 pl-10 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
          />
          {location && (
            <button
              type="button"
              onClick={() => setLocation("")}
              aria-label="Clear location"
              title="Clear location"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="tag-people"
          className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase"
        >
          Tag people (optional)
        </label>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((profile) => (
              <span
                key={profile.id}
                className="flex max-w-full items-center gap-2 rounded-full bg-[var(--powder-tint)] py-1 pr-3 pl-1 text-xs font-medium text-[var(--ink)]"
              >
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-5 w-5 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--paper)] text-[10px] font-semibold text-[var(--ink)]">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                )}
                <span
                  title={`@${profile.username}`}
                  className="min-w-0 max-w-[8rem] truncate"
                >
                  @{profile.username}
                </span>
                <button
                  type="button"
                  onClick={() => removeTag(profile.id)}
                  aria-label={`Remove ${profile.username}`}
                  className="shrink-0 text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          id="tag-people"
          type="text"
          value={tagQuery}
          onChange={(event) => handleTagQueryChange(event.target.value)}
          placeholder="Search by username…"
          className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--blush)]"
        />

        {tagQuery.trim() && (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-1">
            {tagSearching ? (
              <p className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-[var(--ink-soft)]">
                <Spinner />
                Searching…
              </p>
            ) : tagSearchError ? (
              <p className="px-3 py-2 text-sm text-[var(--ink-soft)]">
                Couldn&apos;t search right now. Try again.
              </p>
            ) : tagResults.length === 0 ? (
              <p className="px-3 py-2 text-sm text-[var(--ink-soft)]">
                No matches.
              </p>
            ) : (
              tagResults.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => addTag(profile)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[var(--cream)]"
                >
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--powder-tint)] text-xs font-semibold text-[var(--ink)]">
                      {profile.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span
                    title={`@${profile.username}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ink)]"
                  >
                    @{profile.username}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--blush)] bg-[var(--blush-tint)] px-3.5 py-2.5 text-sm text-[var(--ink)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || redirecting}
        className="flex items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--cream)] transition-opacity disabled:opacity-60"
      >
        {loading && (
          <Spinner className="h-4 w-4 border-2 border-[var(--cream)]/30 border-t-[var(--cream)]" />
        )}
        {loading ? "Sharing…" : "Share"}
      </button>
    </form>
  );
}
