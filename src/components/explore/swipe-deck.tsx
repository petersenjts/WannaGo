"use client";

import { useRef, useState } from "react";
import { recordSwipe } from "@/actions/explore";
import { SwipeCard } from "./swipe-card";
import type { ListingWithPhotos } from "./types";

const SWIPE_THRESHOLD_PX = 100;
const TAP_MOVE_THRESHOLD_PX = 8;
const TAP_MAX_DURATION_MS = 300;
const EXIT_DURATION_MS = 250;
const STACK_SIZE = 3; // current card + this many preloaded behind it

export function SwipeDeck({ listings }: { listings: ListingWithPhotos[] }) {
  const [index, setIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [exiting, setExiting] = useState<"like" | "pass" | null>(null);
  // Mirrors draggingRef but as render-safe state, purely to decide whether the
  // CSS transition should be on (snapping back / exiting) or off (following
  // the pointer 1:1 mid-drag) — refs can't be read during render.
  const [isDragging, setIsDragging] = useState(false);

  const pointerStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const draggingRef = useRef(false);

  const current = listings[index];
  const stack = listings.slice(index, index + STACK_SIZE);

  function commit(liked: boolean) {
    if (!current || exiting) return;
    setExiting(liked ? "like" : "pass");
    recordSwipe(current.id, liked);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setPhotoIndex(0);
      setDragX(0);
      setExiting(null);
    }, EXIT_DURATION_MS);
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (exiting) return;
    pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    draggingRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointerStart.current || exiting) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    if (!draggingRef.current && Math.abs(dx) > TAP_MOVE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
      draggingRef.current = true;
      setIsDragging(true);
    }
    if (draggingRef.current) {
      setDragX(dx);
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || exiting) return;

    const dx = e.clientX - start.x;
    const duration = Date.now() - start.time;

    if (draggingRef.current) {
      draggingRef.current = false;
      setIsDragging(false);
      if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
        commit(dx > 0);
      } else {
        setDragX(0);
      }
      return;
    }

    // Not a drag — a tap. Small movement, short press, cycle photos instead.
    if (Math.abs(dx) < TAP_MOVE_THRESHOLD_PX && duration < TAP_MAX_DURATION_MS && current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const tappedRight = e.clientX - rect.left > rect.width / 2;
      setPhotoIndex((p) => {
        const count = current.photos.length || 1;
        const next = tappedRight ? p + 1 : p - 1;
        return (next + count) % count;
      });
    }
  }

  if (!current) {
    return (
      <p className="card text-ink-soft">
        You&apos;ve seen everything here right now — check back soon.
      </p>
    );
  }

  return (
    <div>
      <div className="relative h-[70vh] max-h-[640px] min-h-[420px] select-none">
        {stack
          .map((listing, i) => ({ listing, i }))
          .reverse()
          .map(({ listing, i }) => {
            const isTop = i === 0;
            const transform = isTop
              ? `translateX(${dragX}px) rotate(${dragX / 20}deg)`
              : `translateY(${i * 10}px) scale(${1 - i * 0.04})`;
            const exitTransform =
              isTop && exiting
                ? `translateX(${exiting === "like" ? 600 : -600}px) rotate(${exiting === "like" ? 20 : -20}deg)`
                : transform;

            return (
              <div
                key={listing.id}
                className="absolute inset-0"
                style={{
                  transform: exitTransform,
                  opacity: isTop && exiting ? 0 : 1,
                  transition:
                    isTop && (exiting || !isDragging)
                      ? `transform ${EXIT_DURATION_MS}ms ease-out, opacity ${EXIT_DURATION_MS}ms ease-out`
                      : "none",
                  zIndex: STACK_SIZE - i,
                  pointerEvents: isTop ? "auto" : "none",
                }}
                onPointerDown={isTop ? handlePointerDown : undefined}
                onPointerMove={isTop ? handlePointerMove : undefined}
                onPointerUp={isTop ? handlePointerUp : undefined}
              >
                <SwipeCard
                  listing={listing}
                  photoIndex={isTop ? photoIndex : 0}
                  onDotClick={isTop ? setPhotoIndex : undefined}
                />
              </div>
            );
          })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => commit(false)}
          aria-label="Pass"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-card text-2xl text-muted shadow-[0_2px_12px_-2px_rgba(51,41,31,0.2)] transition-transform hover:scale-105"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => commit(true)}
          aria-label="Like"
          className="flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-[0_2px_12px_-2px_rgba(51,41,31,0.3)] transition-transform hover:scale-105"
          style={{ background: "var(--accent, var(--color-ink))" }}
        >
          ♥
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-muted">{listings.length - index} left to see</p>
    </div>
  );
}
