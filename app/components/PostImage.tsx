"use client";

import { useState } from "react";
import Image from "next/image";

// Posts have no recorded width/height — storing that would mean a schema
// change, out of scope here — so the real aspect ratio isn't known until the
// browser has the image. Reserving a neutral square up front and snapping to
// the image's true ratio on load turns an unbounded "zero to full height"
// shift into one bounded, single reflow, with the photo never cropped or
// stretched at either stage (object-contain throughout; the box becomes an
// exact fit once the true ratio is known, so cropping never actually occurs).
const DEFAULT_ASPECT_RATIO = "1 / 1";

export default function PostImage({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);

  if (failed) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 bg-[var(--cream)] px-6 text-center">
        <p className="text-sm text-[var(--ink-soft)]">
          This photo couldn&apos;t be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[var(--cream)]" style={{ aspectRatio }}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 672px, 100vw"
        className="object-contain"
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth && naturalHeight) {
            setAspectRatio(`${naturalWidth} / ${naturalHeight}`);
          }
        }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
