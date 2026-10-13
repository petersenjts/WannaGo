import { db } from "@/lib/db";

const SETTINGS_ID = "singleton";

/**
 * Self-healing read — the row materializes with defaults on first use, so
 * no seed migration is needed for this (the first DB-backed admin config
 * in this app).
 */
export async function getDiscoverySettings() {
  return db.discoverySettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID },
  });
}

export { SETTINGS_ID };
