import { db } from "@/lib/db";

export function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const hasLeadingPlus = phone.trim().startsWith("+");
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return hasLeadingPlus ? `+${digits}` : digits;
}

/**
 * Finds the existing customer by normalized email or phone, or creates a new
 * one. This is the mechanism that ties requests from the same person together
 * across both verticals, so cross-vertical usage can be tracked.
 */
export async function findOrCreateCustomer(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
}) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  const existing = await db.customer.findFirst({
    where: {
      OR: [email ? { email } : undefined, phone ? { phone } : undefined].filter(
        (clause): clause is { email: string } | { phone: string } => Boolean(clause)
      ),
    },
  });

  if (existing) {
    // Backfill whichever identifier was missing on the existing record.
    const updates: { email?: string; phone?: string } = {};
    if (email && !existing.email) updates.email = email;
    if (phone && !existing.phone) updates.phone = phone;

    if (Object.keys(updates).length > 0) {
      return db.customer.update({ where: { id: existing.id }, data: updates });
    }
    return existing;
  }

  return db.customer.create({
    data: { name: input.name, email, phone },
  });
}
