"use client";

import { useState, useTransition } from "react";
import { rotateDiscoveryCronSecret } from "@/actions/discovery-settings";

export function RotateCronSecretButton() {
  const [pending, startTransition] = useTransition();
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await rotateDiscoveryCronSecret();
      if (result.ok) {
        setPlaintext(result.plaintextSecret);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <button type="button" disabled={pending} onClick={handleClick} className="btn-secondary">
        Generate new secret
      </button>
      <p className="field-hint">
        Rotating invalidates the old secret immediately — update your external scheduler&apos;s config right after.
      </p>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {plaintext && (
        <div className="mt-4 rounded-lg border border-line bg-paper-alt p-4">
          <p className="text-sm font-medium text-ink">New secret — copy it now, it won&apos;t be shown again:</p>
          <code className="mt-2 block break-all rounded bg-card px-3 py-2 text-xs text-ink">{plaintext}</code>
          <p className="field-hint">
            Send it as the <code>x-discovery-secret</code> header on every request to the scheduled discovery route.
          </p>
        </div>
      )}
    </div>
  );
}
