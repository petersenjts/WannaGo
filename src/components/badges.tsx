import type { RequestStatus, Vertical } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/constants";
import { isInTrial, trialEndDate } from "@/lib/partners";
import { formatDate } from "@/lib/format";

export function VerticalBadge({ vertical }: { vertical: Vertical }) {
  const isStay = vertical === "STAY";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isStay ? "bg-stay-soft text-stay-strong" : "bg-dine-soft text-dine-strong"
      }`}
    >
      {isStay ? "Wannago" : "Wanna Eats"}
    </span>
  );
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  NEW: "bg-paper-alt text-ink-soft",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  SENT_TO_CUSTOMER: "bg-sky-100 text-sky-800",
  BOOKED: "bg-emerald-100 text-emerald-800",
  CLOSED_LOST: "bg-stone-200 text-stone-600",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function TrialBadge({ trialStartDate }: { trialStartDate: Date }) {
  const inTrial = isInTrial(trialStartDate);
  return inTrial ? (
    <span
      className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
      title={`Trial ends ${formatDate(trialEndDate(trialStartDate))}`}
    >
      In trial until {formatDate(trialEndDate(trialStartDate))}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
      Standard rate
    </span>
  );
}

export function CrossVerticalBadge({ otherVertical }: { otherVertical: Vertical }) {
  const isStay = otherVertical === "STAY";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        isStay
          ? "border-stay-soft-line text-stay-strong"
          : "border-dine-soft-line text-dine-strong"
      }`}
      title={`Also has requests on ${isStay ? "Wannago" : "Wanna Eats"}`}
    >
      + {isStay ? "Wannago" : "Wanna Eats"}
    </span>
  );
}
