"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { RequestStatus } from "@prisma/client";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw === null || raw === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

export async function updateRequestStatus(requestId: string, status: RequestStatus) {
  await requireAdmin();
  await db.request.update({ where: { id: requestId }, data: { status } });
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
}

export async function addPartnerContact(requestId: string, formData: FormData) {
  await requireAdmin();
  const partnerId = str(formData, "partnerId") || null;
  const partnerNameIfUnlisted = str(formData, "partnerNameIfUnlisted") || null;
  const quote = optionalNumber(formData, "quote");
  const notes = str(formData, "notes") || null;

  if (!partnerId && !partnerNameIfUnlisted) return;

  await db.partnerContact.create({
    data: { requestId, partnerId, partnerNameIfUnlisted, quote, notes },
  });
  revalidatePath(`/admin/requests/${requestId}`);
}

export async function deletePartnerContact(requestId: string, contactId: string) {
  await requireAdmin();
  await db.partnerContact.delete({ where: { id: contactId } });
  revalidatePath(`/admin/requests/${requestId}`);
}

export async function addShortlistOption(requestId: string, formData: FormData) {
  await requireAdmin();
  const partnerId = str(formData, "partnerId") || null;
  const name = str(formData, "name");
  const price = optionalNumber(formData, "price");
  const notes = str(formData, "notes") || null;
  if (!name) return;

  const count = await db.shortlistOption.count({ where: { requestId } });

  await db.shortlistOption.create({
    data: { requestId, partnerId, name, price, notes, sortOrder: count },
  });
  revalidatePath(`/admin/requests/${requestId}`);
}

export async function deleteShortlistOption(requestId: string, optionId: string) {
  await requireAdmin();
  await db.shortlistOption.delete({ where: { id: optionId } });
  revalidatePath(`/admin/requests/${requestId}`);
}

export async function logOutcome(requestId: string, formData: FormData) {
  await requireAdmin();
  const finalPartnerId = str(formData, "finalPartnerId") || null;
  const finalPartnerNameIfUnlisted = str(formData, "finalPartnerNameIfUnlisted") || null;
  const finalPrice = optionalNumber(formData, "finalPrice");
  const outcomeNotes = str(formData, "outcomeNotes") || null;

  await db.request.update({
    where: { id: requestId },
    data: {
      finalPartnerId,
      finalPartnerNameIfUnlisted,
      finalPrice,
      outcomeNotes,
      closedAt: new Date(),
    },
  });
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
}
