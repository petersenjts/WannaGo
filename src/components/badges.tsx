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
  IN_PROGRESS: "bg-[#F3E6C6] text-[#7A5A1E]",
  SENT_TO_CUSTOMER: "bg-[#E4DCC9] text-ink-soft",
  SELECTED: "bg-[#EAD9C3] text-stay-strong",
  BOOKED: "bg-[#DCE3CE] text-dine-strong",
  CLOSED_LOST: "bg-paper-alt text-muted",
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
      className="inline-flex items-center rounded-full bg-[#F3E6C6] px-2.5 py-0.5 text-xs font-medium text-[#7A5A1E]"
      title={`Trial ends ${formatDate(trialEndDate(trialStartDate))}`}
    >
      In trial until {formatDate(trialEndDate(trialStartDate))}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-[#DCE3CE] px-2.5 py-0.5 text-xs font-medium text-dine-strong">
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
