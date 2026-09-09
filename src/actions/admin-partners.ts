"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PartnerVertical } from "@prisma/client";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createPartner(formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  const vertical = str(formData, "vertical");
  const city = str(formData, "city");
  const contactInfo = str(formData, "contactInfo") || null;
  const trialStartDateRaw = str(formData, "trialStartDate");
  const notes = str(formData, "notes") || null;

  if (!name || !city) return;
  if (vertical !== "HOTEL" && vertical !== "RESTAURANT") return;

  const partner = await db.partner.create({
    data: {
      name,
      vertical: vertical as PartnerVertical,
      city,
      contactInfo,
      trialStartDate: trialStartDateRaw ? new Date(trialStartDateRaw) : new Date(),
      notes,
    },
  });
  revalidatePath("/admin/partners");
  redirect(`/admin/partners/${partner.id}`);
}

export async function updatePartner(partnerId: string, formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  const city = str(formData, "city");
  const contactInfo = str(formData, "contactInfo") || null;
  const trialStartDateRaw = str(formData, "trialStartDate");
  const notes = str(formData, "notes") || null;

  if (!name || !city) return;

  await db.partner.update({
    where: { id: partnerId },
    data: {
      name,
      city,
      contactInfo,
      trialStartDate: trialStartDateRaw ? new Date(trialStartDateRaw) : undefined,
      notes,
    },
  });
  revalidatePath("/admin/partners");
  revalidatePath(`/admin/partners/${partnerId}`);
}
