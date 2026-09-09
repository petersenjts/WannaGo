"use client";

import { useTransition } from "react";
import { selectShortlistOption } from "@/actions/portal-requests";

export function SelectOptionButton({
  requestId,
  optionId,
}: {
  requestId: string;
  optionId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn-primary w-full sm:w-auto"
      disabled={pending}
      onClick={() => startTransition(() => selectShortlistOption(requestId, optionId))}
    >
      {pending ? "Selecting…" : "Select this one"}
    </button>
  );
}
