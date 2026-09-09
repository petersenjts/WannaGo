"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { RequestStatus } from "@prisma/client";
import { createMagicLinkToken } from "@/lib/portal-auth";
import { sendPortalEmail } from "@/lib/email";
import { uploadShortlistPhoto, MAX_PHOTO_BYTES } from "@/lib/cloudinary";

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

  // An uploaded file takes precedence over a pasted URL when both are given.
  let photoUrl = str(formData, "photoUrl") || null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) {
      console.error(`Rejected shortlist photo: not an image (${photo.type})`);
    } else if (photo.size > MAX_PHOTO_BYTES) {
      console.error(`Rejected shortlist photo: too large (${photo.size} bytes)`);
    } else {
      const buffer = Buffer.from(await photo.arrayBuffer());
      photoUrl = await uploadShortlistPhoto(buffer);
    }
  }

  const count = await db.shortlistOption.count({ where: { requestId } });

  await db.shortlistOption.create({
    data: { requestId, partnerId, name, photoUrl, price, notes, sortOrder: count },
  });
  revalidatePath(`/admin/requests/${requestId}`);
}

export async function deleteShortlistOption(requestId: string, optionId: string) {
  await requireAdmin();
  await db.shortlistOption.delete({ where: { id: optionId } });
  revalidatePath(`/admin/requests/${requestId}`);
}

export async function markShortlistReady(requestId: string): Promise<void> {
  await requireAdmin();

  const request = await db.request.findUnique({
    where: { id: requestId },
    include: { customer: true, shortlistOptions: true },
  });
  if (!request || request.shortlistOptions.length === 0) return;

  await db.request.update({ where: { id: requestId }, data: { status: "SENT_TO_CUSTOMER" } });

  if (request.customer.email) {
    const appUrl = process.env.APP_URL;
    if (!appUrl) throw new Error("APP_URL environment variable is not set");
    const token = await createMagicLinkToken(request.customer.email);
    const link = `${appUrl}/portal/verify?token=${token}`;

    await sendPortalEmail({
      to: request.customer.email,
      subject: request.vertical === "STAY" ? "Your stay options are ready" : "Your dining recommendation is ready",
      heading: "Your options are ready",
      body: "Take a look and let us know which one you'd like.",
      ctaLabel: "View your options",
      ctaUrl: link,
    });
  }

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
}

export async function clearSelection(requestId: string): Promise<void> {
  await requireAdmin();
  await db.request.update({
    where: { id: requestId },
    data: { selectedOptionId: null, selectedAt: null, status: "SENT_TO_CUSTOMER" },
  });
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
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
