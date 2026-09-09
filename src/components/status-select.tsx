"use client";

import { useTransition } from "react";
import { updateRequestStatus } from "@/actions/admin-requests";
import { REQUEST_STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { RequestStatus } from "@prisma/client";

export function StatusSelect({ requestId, status }: { requestId: string; status: RequestStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      className="field-input w-auto [--accent:var(--color-ink)]"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as RequestStatus;
        startTransition(() => {
          updateRequestStatus(requestId, next);
        });
      }}
    >
      {REQUEST_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
