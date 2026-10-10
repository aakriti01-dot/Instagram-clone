"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { generateId } from "@/lib/uuid";
import { PlusSquareIcon, CloseIcon } from "@/app/components/icons";
import { searchProfiles, type Profile } from "@/lib/profiles";
import { tagUsers } from "@/lib/postTags";

const TAG_DEBOUNCE_MS = 300;

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

export default function CreatePostForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tagQuery, setTagQuery] = useState("");
  const [tagResults, setTagResults] = useState<Profile[]>([]);
  const [tagSearching, setTagSearching] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Profile[]>([]);

  function handleTagQueryChange(value: string) {
    setTagQuery(value);
    if (!value.trim()) {
      setTagResults([]);
      setTagSearching(false);
    } else {
      setTagSearching(true);
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
          if (!cancelled) setTagResults([]);
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

      const extension = file.name.includes(".")
        ? file.name.split(".").pop()
        : "jpg";
      const path = `${userId}/${generateId()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, file);

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
        })
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      if (selectedTags.length > 0 && insertedPost) {
        try {
          await tagUsers(
            insertedPost.id,
            selectedTags.map((profile) => profile.id)
          );
        } catch (tagError) {
          // The post itself succeeded, which is the primary action — a
          // tagging failure here is secondary and shouldn't block or alarm
          // the user, same convention as deletePost's storageCleanupFailed.
          console.warn("Couldn't save post tags:", tagError);
        }
      }

      router.push("/feed");
      router.refresh();
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
                className="flex items-center gap-1.5 rounded-full bg-[var(--powder-tint)] px-3 py-1.5 text-xs font-medium text-[var(--ink)]"
              >
                @{profile.username}
                <button
                  type="button"
                  onClick={() => removeTag(profile.id)}
                  aria-label={`Remove ${profile.username}`}
                  className="text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
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
              <p className="px-3 py-2 text-sm text-[var(--ink-soft)]">
                Searching…
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
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--cream)]"
                >
                  @{profile.username}
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
        disabled={loading}
        className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-medium text-[var(--cream)] transition-opacity disabled:opacity-60"
      >
        {loading ? "Sharing…" : "Share"}
      </button>
    </form>
  );
}
