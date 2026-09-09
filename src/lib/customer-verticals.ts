import { db } from "@/lib/db";
import type { Vertical } from "@prisma/client";

/**
 * Maps each customer to the set of verticals they've ever submitted a
 * request under. This is the basis for spotting customers who've only used
 * one side of the business.
 */
export async function getVerticalsByCustomer(
  customerIds: string[]
): Promise<Map<string, Set<Vertical>>> {
  if (customerIds.length === 0) return new Map();

  const rows = await db.request.findMany({
    where: { customerId: { in: customerIds } },
    select: { customerId: true, vertical: true },
    distinct: ["customerId", "vertical"],
  });

  const map = new Map<string, Set<Vertical>>();
  for (const row of rows) {
    if (!map.has(row.customerId)) map.set(row.customerId, new Set());
    map.get(row.customerId)!.add(row.vertical);
  }
  return map;
}

export function otherVertical(vertical: Vertical): Vertical {
  return vertical === "STAY" ? "DINE" : "STAY";
}
