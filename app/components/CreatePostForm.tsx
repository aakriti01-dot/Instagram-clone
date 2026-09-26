"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { PlusSquareIcon } from "@/app/components/icons";

export default function CreatePostForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
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
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;

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

      const { error: insertError } = await supabase.from("posts").insert({
        user_id: userId,
        image_url: publicUrl,
        caption: caption.trim() || null,
      });

      if (insertError) {
        setError(insertError.message);
        return;
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
