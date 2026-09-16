"use client";

import { useState, useTransition } from "react";
import { searchGooglePlaces, fetchGooglePlaceDetails } from "@/actions/google-places";
import type { GooglePlaceCandidate } from "@/lib/google-places";

export type GooglePlaceSearchInitial = {
  placeId: string;
  name: string;
  formattedAddress: string;
  rating: number | null;
  reviewCount: number | null;
  cuisine: string | null;
  lastSyncedAt: string | null;
};

type Selected = {
  placeId: string;
  name: string;
  formattedAddress: string;
  rating: number | null;
  reviewCount: number | null;
  cuisine: string | null;
};

export function GooglePlaceSearch({
  defaultQuery,
  neighborhoodInputId,
  priceRadioGroupName,
  vertical,
  verticalSelectId,
  initial,
}: {
  defaultQuery: string;
  neighborhoodInputId: string;
  priceRadioGroupName: string;
  /** Fixed vertical on the edit page; null on the create page (unknown until the admin picks it). */
  vertical: "STAY" | "DINE" | null;
  /** DOM id of the sibling vertical <select> to read from when `vertical` is null. */
  verticalSelectId?: string;
  initial: GooglePlaceSearchInitial | null;
}) {
  const [query, setQuery] = useState(defaultQuery);
  const [candidates, setCandidates] = useState<GooglePlaceCandidate[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selected | null>(
    initial
      ? {
          placeId: initial.placeId,
          name: initial.name,
          formattedAddress: initial.formattedAddress,
          rating: initial.rating,
          reviewCount: initial.reviewCount,
          cuisine: initial.cuisine,
        }
      : null
  );
  const [lastSyncedAt] = useState(initial?.lastSyncedAt ?? null);
  const [pending, startTransition] = useTransition();

  function resolvedVertical(): "STAY" | "DINE" | null {
    if (vertical) return vertical;
    if (!verticalSelectId) return null;
    const el = document.getElementById(verticalSelectId) as HTMLSelectElement | null;
    return el?.value === "DINE" ? "DINE" : el?.value === "STAY" ? "STAY" : null;
  }

  function runSearch() {
    setErrorMessage(null);
    setCandidates(null);
    startTransition(async () => {
      const result = await searchGooglePlaces(query);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      if (result.candidates.length === 0) {
        setErrorMessage("No matches on Google Maps — you can still fill in the fields below by hand.");
        return;
      }
      setCandidates(result.candidates);
    });
  }

  function selectCandidate(candidate: GooglePlaceCandidate) {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await fetchGooglePlaceDetails(candidate.placeId);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      const { details } = result;
      const cuisine = resolvedVertical() === "DINE" ? details.primaryTypeLabel : null;

      setSelected({
        placeId: details.placeId,
        name: details.name,
        formattedAddress: details.formattedAddress,
        rating: details.rating,
        reviewCount: details.reviewCount,
        cuisine,
      });
      setCandidates(null);

      if (details.neighborhood) {
        const el = document.getElementById(neighborhoodInputId) as HTMLInputElement | null;
        if (el) el.value = details.neighborhood;
      }
      if (details.priceLevel !== null) {
        const el = document.querySelector<HTMLInputElement>(
          `input[name="${priceRadioGroupName}"][value="${details.priceLevel}"]`
        );
        if (el) el.checked = true;
      }
    });
  }

  function clearSelection() {
    setSelected(null);
    setCandidates(null);
    setErrorMessage(null);
  }

  return (
    <div className="sm:col-span-2">
      <p className="field-label">Google Maps match</p>

      {selected ? (
        <div className="rounded-lg border border-line bg-paper-alt p-4">
          <p className="text-sm text-ink">
            Linked to Google Maps: <span className="font-medium">{selected.name}</span>
            {selected.rating !== null && (
              <>
                {" "}
                · ★ {selected.rating.toFixed(1)}
                {selected.reviewCount !== null && ` (${selected.reviewCount})`}
              </>
            )}
          </p>
          {selected.formattedAddress && <p className="mt-1 text-xs text-muted">{selected.formattedAddress}</p>}
          {lastSyncedAt && (
            <p className="mt-1 text-xs text-muted">
              Last synced {new Date(lastSyncedAt).toLocaleDateString()}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">Google Maps</p>
          <button type="button" onClick={clearSelection} className="mt-2 text-xs text-muted hover:text-danger">
            Search a different place / unlink
          </button>

          <input type="hidden" name="googlePlaceId" value={selected.placeId} />
          <input type="hidden" name="googleFormattedAddress" value={selected.formattedAddress} />
          {selected.rating !== null && <input type="hidden" name="googleRating" value={selected.rating} />}
          {selected.reviewCount !== null && (
            <input type="hidden" name="googleReviewCount" value={selected.reviewCount} />
          )}
          {selected.cuisine && <input type="hidden" name="cuisine" value={selected.cuisine} />}
        </div>
      ) : (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Restaurant or hotel name, city"
              className="field-input [--accent:var(--color-ink)]"
            />
            <button
              type="button"
              disabled={pending || !query.trim()}
              onClick={runSearch}
              className="btn-secondary shrink-0"
            >
              Search
            </button>
          </div>
          <p className="field-hint">
            Optional — find the real listing on Google Maps to auto-fill price, rating, and location. You can
            still save without it.
          </p>

          {errorMessage && <p className="mt-2 text-sm text-muted">{errorMessage}</p>}

          {candidates && candidates.length > 0 && (
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
              {candidates.map((c) => (
                <li key={c.placeId}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => selectCandidate(c)}
                    className="block w-full px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-paper-alt"
                  >
                    <span className="font-medium text-ink">{c.name}</span>
                    {c.primaryTypeLabel && <span className="text-ink-soft"> · {c.primaryTypeLabel}</span>}
                    {c.formattedAddress && <p className="text-xs text-muted">{c.formattedAddress}</p>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
