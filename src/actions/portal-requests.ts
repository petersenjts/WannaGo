"use server";

import { db } from "@/lib/db";
import { requirePortalCustomer } from "@/lib/portal-auth";
import { revalidatePath } from "next/cache";

export async function selectShortlistOption(requestId: string, optionId: string): Promise<void> {
  const email = await requirePortalCustomer();

  const request = await db.request.findUnique({
    where: { id: requestId },
    include: { customer: true, shortlistOptions: true },
  });

  // Ownership and state checks happen server-side — never trust the client.
  if (!request || request.customer.email !== email) return;
  if (request.status !== "SENT_TO_CUSTOMER") return;
  const option = request.shortlistOptions.find((o) => o.id === optionId);
  if (!option) return;

  await db.request.update({
    where: { id: requestId },
    data: { selectedOptionId: option.id, selectedAt: new Date(), status: "SELECTED" },
  });

  revalidatePath(`/portal/requests/${requestId}`);
  revalidatePath("/portal");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/requests");
}
