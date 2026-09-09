"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadExplorePhoto, MAX_PHOTO_BYTES } from "@/lib/cloudinary";
import type { Vertical } from "@prisma/client";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

async function uploadPhotos(formData: FormData, listingId: string): Promise<void> {
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;

  const count = await db.exploreListingPhoto.count({ where: { listingId } });

  let sortOrder = count;
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      console.error(`Rejected Explore photo: not an image (${file.type})`);
      continue;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      console.error(`Rejected Explore photo: too large (${file.size} bytes)`);
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadExplorePhoto(buffer);
    await db.exploreListingPhoto.create({ data: { listingId, url, sortOrder: sortOrder++ } });
  }
}

export async function createListing(formData: FormData): Promise<void> {
  await requireAdmin();

  const name = str(formData, "name");
  const vertical = str(formData, "vertical");
  const priceLevel = Number(formData.get("priceLevel"));
  const description = str(formData, "description") || null;
  const neighborhood = str(formData, "neighborhood") || null;
  const tags = parseTags(str(formData, "tags"));

  if (!name || (vertical !== "STAY" && vertical !== "DINE")) return;
  if (!Number.isInteger(priceLevel) || priceLevel < 1 || priceLevel > 4) return;

  const listing = await db.exploreListing.create({
    data: {
      name,
      vertical: vertical as Vertical,
      priceLevel,
      description,
      neighborhood,
      tags,
    },
  });

  await uploadPhotos(formData, listing.id);

  revalidatePath("/admin/explore");
  redirect(`/admin/explore/${listing.id}`);
}

export async function updateListing(listingId: string, formData: FormData): Promise<void> {
  await requireAdmin();

  const name = str(formData, "name");
  const priceLevel = Number(formData.get("priceLevel"));
  const description = str(formData, "description") || null;
  const neighborhood = str(formData, "neighborhood") || null;
  const tags = parseTags(str(formData, "tags"));

  if (!name) return;
  if (!Number.isInteger(priceLevel) || priceLevel < 1 || priceLevel > 4) return;

  await db.exploreListing.update({
    where: { id: listingId },
    data: { name, priceLevel, description, neighborhood, tags },
  });

  await uploadPhotos(formData, listingId);

  revalidatePath("/admin/explore");
  revalidatePath(`/admin/explore/${listingId}`);
}

export async function toggleListingActive(listingId: string, active: boolean): Promise<void> {
  await requireAdmin();
  await db.exploreListing.update({ where: { id: listingId }, data: { active } });
  revalidatePath("/admin/explore");
  revalidatePath(`/admin/explore/${listingId}`);
}

export async function deletePhoto(listingId: string, photoId: string): Promise<void> {
  await requireAdmin();
  await db.exploreListingPhoto.delete({ where: { id: photoId } });
  revalidatePath(`/admin/explore/${listingId}`);
}

export async function deleteListing(listingId: string): Promise<void> {
  await requireAdmin();
  await db.exploreListing.delete({ where: { id: listingId } });
  revalidatePath("/admin/explore");
  redirect("/admin/explore");
}
