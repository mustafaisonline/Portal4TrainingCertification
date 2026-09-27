import { headers } from "next/headers";
import { getPrisma } from "@/db/prisma";

/*
 * The public certificate search's rate limit (M6 plan §3 E12): 10 searches
 * a minute per client key, counted in the database (`auth_rate_limits`,
 * prefix `verify:`) so a restart forgets nothing and name enumeration stays
 * slow. Shared since Milestone 14 Phase 1 by /verify and the header search
 * (/search), which must not offer a faster path to the same rows.
 */

export const SEARCH_WINDOW_MS = 60 * 1000;
export const SEARCH_MAX_PER_WINDOW = 10;

export async function certificateSearchOverLimit(clientKey: string): Promise<boolean> {
  const prisma = getPrisma();
  const key = `verify:${clientKey}`;
  const now = Date.now();
  const row = await prisma.authRateLimit.findUnique({ where: { key } });
  if (!row || now - Number(row.lastRequest) > SEARCH_WINDOW_MS) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { id: key, key, count: 1, lastRequest: BigInt(now) },
      update: { count: 1, lastRequest: BigInt(now) },
    });
    return false;
  }
  if (row.count >= SEARCH_MAX_PER_WINDOW) return true;
  await prisma.authRateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return false;
}

/** The requesting client, by forwarded address; "local" in development. */
export async function searchClientKey(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0]!.trim();
}
