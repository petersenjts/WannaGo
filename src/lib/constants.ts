import type { RequestStatus } from "@prisma/client";

export const STAY_PREFERENCE_TAGS = [
  "Design-led",
  "Quiet street",
  "Central",
  "Breakfast included",
  "Pet friendly",
  "Canal view",
  "Rooftop",
  "Family friendly",
  "Adults only",
  "Spa / wellness",
] as const;

export const REQUEST_STATUSES: RequestStatus[] = [
  "NEW",
  "IN_PROGRESS",
  "SENT_TO_CUSTOMER",
  "SELECTED",
  "BOOKED",
  "CLOSED_LOST",
];

export const STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  SENT_TO_CUSTOMER: "Sent to customer",
  SELECTED: "Selected — book it",
  BOOKED: "Booked",
  CLOSED_LOST: "Closed / lost",
};

// 12% on hotel booking value, 10% on the restaurant bill, after a 3-month
// free trial per partner.
export const COMMISSION_RATES = {
  HOTEL: 0.12,
  RESTAURANT: 0.1,
} as const;

export const TRIAL_LENGTH_MONTHS = 3;
