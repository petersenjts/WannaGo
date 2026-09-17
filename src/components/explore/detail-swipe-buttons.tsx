"use client";

import { useState, useTransition } from "react";
import { recordSwipe } from "@/actions/explore";

export function DetailSwipeButtons({
  listingId,
  initialLiked,
}: {
  listingId: string;
  initialLiked: boolean | null;
}) {
  const [liked, setLiked] = useState<boolean | null>(initialLiked);
  const [pending, startTransition] = useTransition();

  function choose(next: boolean) {
    setLiked(next);
    startTransition(() => {
      recordSwipe(listingId, next);
    });
  }

  return (
    <div className="flex gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => choose(false)}
        className={`btn-secondary ${liked === false ? "ring-2" : ""}`}
        style={liked === false ? { ["--tw-ring-color" as string]: "var(--accent, var(--color-ink))" } : undefined}
      >
        {liked === false ? "Passed" : "Pass"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => choose(true)}
        className="btn-primary"
        style={liked === true ? { filter: "brightness(1.1)" } : undefined}
      >
        {liked === true ? "Saved ♥" : "Save"}
      </button>
    </div>
  );
}
