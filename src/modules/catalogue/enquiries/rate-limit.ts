import { withTransaction } from "@/db/prisma";

/*
 * Contact Us abuse limits (CR-2026-10-03-1226), counted in the database so a
 * restart forgets nothing — the `auth_rate_limits` table with its own key
 * prefix (no new table), the same fixed-window rule the public certificate
 * search uses.
 *
 * ATOMIC (security review M1): the count is one INSERT … ON CONFLICT … UPDATE
 * … RETURNING statement taken under a per-key advisory lock, so 100 parallel
 * requests cannot all read "below the limit" before any of them counts. Every
 * call counts, including the ones that are refused. Returns true when the
 * caller is OVER the limit.
 */
export async function enquiryOverLimit(scope: string, clientKey: string, windowMs: number, max: number, now: number = Date.now()): Promise<boolean> {
  const key = `enquiry:${scope}:${clientKey}`;
  return withTransaction(async (tx) => {
    // Same-key requests take turns: a transaction-scoped advisory lock (released at commit). Without it two
    // first requests both try to INSERT and one fails on the table's primary key before ON CONFLICT (key) can help.
    await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(hashtext(${key}))) AS l`;
    const rows = await tx.$queryRaw<{ count: number }[]>`
      INSERT INTO auth_rate_limits (id, key, count, last_request)
      VALUES (${key}, ${key}, 1, ${BigInt(now)})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN ${BigInt(now)} - auth_rate_limits.last_request > ${BigInt(windowMs)} THEN 1 ELSE auth_rate_limits.count + 1 END,
        last_request = CASE WHEN ${BigInt(now)} - auth_rate_limits.last_request > ${BigInt(windowMs)} THEN ${BigInt(now)} ELSE auth_rate_limits.last_request END
      RETURNING count`;
    return Number(rows[0]?.count ?? 1) > max;
  });
}

/**
 * The key a client is limited under. An IPv6 address is reduced to its /64 (the
 * block one subscriber controls) so rotating addresses inside it does not
 * dodge the limit; an IPv4 address and "local" are used as they are.
 */
export function clientKeyOf(raw: string): string {
  const ip = raw.trim().toLowerCase();
  if (!ip.includes(":") || ip.includes(".")) return ip; // IPv4, IPv4-mapped IPv6, or a name
  const [head = "", tail = ""] = ip.split("::", 2);
  const groups = ip.includes("::") ? [...head.split(":").filter(Boolean), ...Array(Math.max(0, 8 - head.split(":").filter(Boolean).length - tail.split(":").filter(Boolean).length)).fill("0"), ...tail.split(":").filter(Boolean)] : ip.split(":");
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}
