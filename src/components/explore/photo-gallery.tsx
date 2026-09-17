"use client";

import { useState } from "react";
import { OptionPhoto } from "@/components/option-photo";
import type { ExploreListingPhoto } from "@prisma/client";

export function PhotoGallery({ photos, alt }: { photos: ExploreListingPhoto[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = photos[activeIndex] ?? photos[0] ?? null;

  return (
    <div>
      <OptionPhoto src={active?.url ?? null} alt={alt} className="h-72 w-full rounded-3xl object-cover sm:h-96" />
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Photo ${i + 1}`}
              onClick={() => setActiveIndex(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl transition-opacity ${
                i === activeIndex ? "ring-2 ring-offset-2" : "opacity-60 hover:opacity-100"
              }`}
              style={i === activeIndex ? { ["--tw-ring-color" as string]: "var(--accent, var(--color-ink))" } : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
