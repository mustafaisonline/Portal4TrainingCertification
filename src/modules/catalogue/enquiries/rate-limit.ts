import { getPrisma } from "@/db/prisma";

/*
 * Contact Us abuse limits (CR-2026-10-03-1226), counted in the database so a
 * restart forgets nothing — the same table and fixed-window rule the public
 * certificate search uses (`auth_rate_limits`, its own key prefix, no new
 * table). Returns true when the caller is OVER the limit; otherwise it counts
 * this request.
 */
export async function enquiryOverLimit(scope: string, clientKey: string, windowMs: number, max: number, now: number = Date.now()): Promise<boolean> {
  const prisma = getPrisma();
  const key = `enquiry:${scope}:${clientKey}`;
  const row = await prisma.authRateLimit.findUnique({ where: { key } });
  if (!row || now - Number(row.lastRequest) > windowMs) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { id: key, key, count: 1, lastRequest: BigInt(now) },
      update: { count: 1, lastRequest: BigInt(now) },
    });
    return false;
  }
  if (row.count >= max) return true;
  await prisma.authRateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return false;
}
