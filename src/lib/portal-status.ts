import type { RequestStatus } from "@prisma/client";

// Customer-facing status copy — deliberately coarser than the concierge's
// internal pipeline (NEW and IN_PROGRESS both just read as "we're on it").
export const CUSTOMER_STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: "We're finding your options",
  IN_PROGRESS: "We're finding your options",
  SENT_TO_CUSTOMER: "Your options are ready",
  SELECTED: "We're finalizing your booking",
  BOOKED: "Booked",
  CLOSED_LOST: "Closed",
};

export function customerStatusLabel(status: RequestStatus): string {
  return CUSTOMER_STATUS_LABELS[status];
}
