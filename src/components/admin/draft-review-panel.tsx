"use client";

import { useState } from "react";
import { approveDraftListing, rejectDraftListing } from "@/actions/explore-discovery";
import { ReviewStatusBadge } from "@/components/badges";
import type { ExploreListingReviewStatus } from "@prisma/client";
import type { ClaimCheck } from "@/lib/claude-verification";

export function DraftReviewPanel({
  listingId,
  reviewStatus,
  sourceUrls,
  sourceExcerpts,
  uncertainClaims,
  claimChecks,
  textEdited,
  approvedWithOverride,
}: {
  listingId: string;
  reviewStatus: ExploreListingReviewStatus;
  sourceUrls: string[];
  sourceExcerpts: { url: string; text: string }[];
  uncertainClaims: string[];
  claimChecks: ClaimCheck[];
  textEdited: boolean;
  approvedWithOverride: boolean;
}) {
  const hasUnsupportedClaims = claimChecks.some((c) => !c.supported);
  const needsResolution = hasUnsupportedClaims && !textEdited;
  const [override, setOverride] = useState(false);
  const approveDisabled = needsResolution && !override;

  return (
    <section className="card mt-8 max-w-2xl">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-serif text-h2 text-ink">AI draft review</h2>
        <ReviewStatusBadge status={reviewStatus} />
        {approvedWithOverride && (
          <span className="inline-flex items-center rounded-full bg-[#F3E6C6] px-2.5 py-0.5 text-xs font-medium text-[#7A5A1E]">
            Approved with override
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="field-label">Sources used</p>
        {sourceUrls.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {sourceUrls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" className="text-sm text-ink-soft hover:underline">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No official website was available.</p>
        )}
      </div>

      {sourceExcerpts.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="field-label">Source text given to the model</p>
          {sourceExcerpts.map((s) => (
            <details key={s.url} className="rounded-lg border border-line">
              <summary className="cursor-pointer px-3.5 py-2 text-sm text-ink-soft">{s.url}</summary>
              <pre className="whitespace-pre-wrap break-words px-3.5 pb-3 text-xs text-muted">{s.text}</pre>
            </details>
          ))}
        </div>
      )}

      {uncertainClaims.length > 0 && (
        <div className="mt-4 rounded-lg bg-[#F3E6C6] p-4 text-sm text-[#7A5A1E]">
          <p className="font-medium">Flagged as uncertain — worth checking before approving:</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {uncertainClaims.map((claim, i) => (
              <li key={i}>{claim}</li>
            ))}
          </ul>
        </div>
      )}

      {claimChecks.length > 0 && (
        <div className="mt-4">
          <p className="field-label">Claim check</p>
          <ul className="mt-1 space-y-1.5">
            {claimChecks.map((c, i) => (
              <li
                key={i}
                className={`rounded-lg p-3 text-sm ${
                  c.supported ? "bg-[#DCE3CE] text-dine-strong" : "bg-[#F3E6C6] text-[#7A5A1E]"
                }`}
              >
                <p>{c.text}</p>
                {!c.supported && c.note && <p className="mt-1 text-xs">{c.note}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={approveDraftListing.bind(null, listingId)} className="mt-5">
        {needsResolution && (
          <label className="mb-3 flex items-start gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="override"
              checked={override}
              onChange={(e) => setOverride(e.target.checked)}
              className="mt-0.5"
            />
            Approve anyway, despite the unsupported claim(s) above.
          </label>
        )}
        <div className="flex gap-3">
          <button type="submit" disabled={approveDisabled} className="btn-primary">
            Approve
          </button>
        </div>
        {approveDisabled && (
          <p className="field-hint">
            Unsupported claims found — edit the text below and save, or check the override box, before approving.
          </p>
        )}
      </form>
      <form action={rejectDraftListing.bind(null, listingId)} className="mt-2">
        <button type="submit" className="btn-secondary">Reject</button>
      </form>
      <p className="field-hint">
        Edit the fields below first if you want, then Approve — rejecting keeps the place excluded from future
        discovery runs instead of letting it be reprocessed.
      </p>
    </section>
  );
}
