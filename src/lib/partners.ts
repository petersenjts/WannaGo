import { COMMISSION_RATES, TRIAL_LENGTH_MONTHS } from "@/lib/constants";
import type { PartnerVertical } from "@prisma/client";

export function trialEndDate(trialStartDate: Date): Date {
  const end = new Date(trialStartDate);
  end.setMonth(end.getMonth() + TRIAL_LENGTH_MONTHS);
  return end;
}

export function isInTrial(trialStartDate: Date, now: Date = new Date()): boolean {
  return now < trialEndDate(trialStartDate);
}

export function commissionRateFor(vertical: PartnerVertical): number {
  return COMMISSION_RATES[vertical];
}
