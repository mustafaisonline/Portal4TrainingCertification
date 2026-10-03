import { isIP } from "node:net";
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
 * The key a client is limited under. Only a real IP address (or "local" in
 * development) becomes a key — anything else, or anything long, falls into ONE
 * "unknown" bucket (security review L-A), so a forged header can neither bloat
 * the table nor crash the INSERT on an over-long key. An IPv4-mapped IPv6 value
 * is treated as the IPv4 it carries; an IPv6 address is reduced to its /64 (the
 * block one subscriber controls) so rotating inside it does not dodge the limit.
 */
export function clientKeyOf(raw: string): string {
  const ip = raw.trim().toLowerCase();
  if (ip === "local") return ip;
  if (ip.length > 45 || isIP(ip) === 0) return "unknown";
  if (ip.startsWith("::ffff:") && isIP(ip.slice(7)) === 4) return ip.slice(7);
  if (isIP(ip) === 4) return ip;
  const [head = "", tail = ""] = ip.split("::", 2);
  const headGroups = head.split(":").filter(Boolean);
  const tailGroups = tail.split(":").filter(Boolean);
  const groups = ip.includes("::") ? [...headGroups, ...Array(Math.max(0, 8 - headGroups.length - tailGroups.length)).fill("0"), ...tailGroups] : ip.split(":");
  return `${groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, "")).join(":")}::/64`;
}
