"use client";

import { useState, useTransition } from "react";
import { recordSwipe } from "@/actions/explore";

export function LikeButton({ listingId }: { listingId: string }) {
  const [liked, setLiked] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={liked ? "Saved" : "Save"}
      onClick={() => {
        const next = !liked;
        setLiked(next);
        startTransition(() => {
          recordSwipe(listingId, next);
        });
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors ${
        liked ? "text-white" : "bg-card text-muted hover:text-ink"
      }`}
      style={liked ? { background: "var(--accent, var(--color-ink))" } : undefined}
    >
      ♥
    </button>
  );
}
