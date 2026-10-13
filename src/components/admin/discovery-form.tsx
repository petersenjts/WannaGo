"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  previewDiscoveryAction,
  runDiscoveryAction,
  type PreviewDiscoveryResult,
  type RunDiscoveryResult,
} from "@/actions/explore-discovery";

type SearchParams = { area: string; vertical: string; minRating: string; minReviewCount: string };

export function DiscoveryForm() {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<PreviewDiscoveryResult | null>(null);
  const [runResult, setRunResult] = useState<RunDiscoveryResult | null>(null);
  const [lastParams, setLastParams] = useState<SearchParams | null>(null);

  function handlePreview(formData: FormData) {
    setRunResult(null);
    setLastParams({
      area: String(formData.get("area") ?? ""),
      vertical: String(formData.get("vertical") ?? ""),
      minRating: String(formData.get("minRating") ?? ""),
      minReviewCount: String(formData.get("minReviewCount") ?? ""),
    });
    startTransition(async () => {
      const result = await previewDiscoveryAction(formData);
      setPreview(result);
    });
  }

  function handleRun(formData: FormData) {
    startTransition(async () => {
      const result = await runDiscoveryAction(formData);
      setRunResult(result);
      setPreview(null);
    });
  }

  return (
    <div className="card mt-8 max-w-2xl">
      <p className="text-sm text-ink-soft">
        Searches Google Places for an area, skips anything already in Explore, reads each
        place&apos;s own website, and asks Claude to write a draft description — saved inactive for
        you to review before anything goes live.
      </p>

      <form action={handlePreview} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="area">Area</label>
          <input
            id="area"
            name="area"
            type="text"
            required
            placeholder="Amsterdam, Jordaan..."
            className="field-input [--accent:var(--color-ink)]"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="vertical">Vertical</label>
          <select id="vertical" name="vertical" className="field-input [--accent:var(--color-ink)]">
            <option value="STAY">Wannago (hotels)</option>
            <option value="DINE">Wanna Eats (restaurants)</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="minRating">Minimum rating</label>
          <input
            id="minRating"
            name="minRating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            defaultValue="4.0"
            className="field-input [--accent:var(--color-ink)]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="minReviewCount">Minimum review count</label>
          <input
            id="minReviewCount"
            name="minReviewCount"
            type="number"
            min="0"
            defaultValue="50"
            className="field-input [--accent:var(--color-ink)]"
          />
          <p className="field-hint">
            Google&apos;s search step can&apos;t filter by rating/reviews — these apply once each
            candidate&apos;s details are fetched, during the real run, not in the preview below.
          </p>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className="btn-secondary">
            Preview
          </button>
        </div>
      </form>

      {preview && !preview.ok && <p className="mt-4 text-sm text-danger">{preview.error}</p>}

      {preview && preview.ok && (
        <div className="mt-6 border-t border-line pt-6">
          <p className="text-sm text-ink">
            {preview.candidates.length} candidate{preview.candidates.length === 1 ? "" : "s"} found
            (already-known places excluded).
          </p>
          <p className="mt-1 text-xs text-muted">
            Estimated cost if you run all of them — planning estimates, not quotes: Google ~$
            {preview.estimatedGoogleCostUsd.toFixed(2)} · Claude ~$
            {preview.estimatedClaudeCostUsd.toFixed(2)}
          </p>

          {preview.candidates.length > 0 && (
            <>
              <ul className="mt-3 max-h-48 divide-y divide-line overflow-y-auto rounded-lg border border-line">
                {preview.candidates.map((c) => (
                  <li key={c.placeId} className="px-3.5 py-2 text-sm">
                    <span className="font-medium text-ink">{c.name}</span>
                    <p className="text-xs text-muted">{c.address}</p>
                  </li>
                ))}
              </ul>

              <form action={handleRun} className="mt-4 flex flex-wrap items-end gap-3">
                <input type="hidden" name="area" value={lastParams?.area ?? ""} />
                <input type="hidden" name="vertical" value={lastParams?.vertical ?? ""} />
                <input type="hidden" name="minRating" value={lastParams?.minRating ?? ""} />
                <input type="hidden" name="minReviewCount" value={lastParams?.minReviewCount ?? ""} />
                <div>
                  <label className="field-label" htmlFor="cap">Cap (max drafts this run)</label>
                  <input
                    id="cap"
                    name="cap"
                    type="number"
                    min="1"
                    max="30"
                    defaultValue="10"
                    className="field-input w-32 [--accent:var(--color-ink)]"
                  />
                  <p className="field-hint">
                    A large cap on one run risks a platform timeout partway through — safe to
                    re-run, since completed drafts are saved as they&apos;re generated.
                  </p>
                </div>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? "Running…" : "Run now"}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {runResult && !runResult.ok && <p className="mt-4 text-sm text-danger">{runResult.error}</p>}

      {runResult && runResult.ok && (
        <div className="mt-6 border-t border-line pt-6 text-sm">
          <p className="text-ink">
            Created {runResult.created} draft{runResult.created === 1 ? "" : "s"}
            {runResult.skipped > 0 && `, skipped ${runResult.skipped} (below rating/review minimums)`}.
          </p>
          {runResult.errors.length > 0 && (
            <ul className="mt-2 text-xs text-muted">
              {runResult.errors.map((e, i) => (
                <li key={i}>
                  {e.place}: {e.error}
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/explore?review=pending" className="mt-3 inline-block text-ink-soft hover:underline">
            Review the new drafts →
          </Link>
        </div>
      )}
    </div>
  );
}
