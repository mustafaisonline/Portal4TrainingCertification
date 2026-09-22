import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { todayIso } from "./dates";
import { findByCertificateId, searchListedByName, toPublicView, type PublicCertificateView } from "./repository";
import { classifySearch } from "./rules";

/*
 * Public /verify search (M6 plan §5 "Search"; requirements §5). Returns
 * PUBLIC views only. "No results" is the same shape for an unlisted holder
 * and for a name nobody has (R-V2 privacy). Rate limiting (10 searches /
 * minute per client key, database-backed) is the ROUTE's job — the same
 * `auth_rate_limits` prefix pattern the enquiry form and reviews use — so
 * the service stays testable without request headers.
 */

export type CertificateSearchOutcome =
  | { kind: "empty" }
  | { kind: "too_short" }
  | { kind: "id"; id: string; result: PublicCertificateView | null }
  | { kind: "name"; results: PublicCertificateView[]; truncated: boolean };

export async function searchCertificates(input: string, now = new Date(), db: Db = getPrisma()): Promise<CertificateSearchOutcome> {
  const c = classifySearch(input);
  if (c.kind === "empty" || c.kind === "too_short") return c;
  const today = todayIso(now);
  if (c.kind === "id") {
    const record = await findByCertificateId(c.id, db);
    return { kind: "id", id: c.id, result: record ? toPublicView(record, today) : null };
  }
  const { items, truncated } = await searchListedByName(c.words, db);
  return { kind: "name", results: items.map((r) => toPublicView(r, today)), truncated };
}

/** `/verify/[id]`: the public view for one printed ID, or null → 404. Found
 *  whether or not the holder is listed; revoked and expired still verify. */
export async function publicCertificateById(input: string, now = new Date(), db: Db = getPrisma()): Promise<PublicCertificateView | null> {
  const record = await findByCertificateId(input, db);
  return record ? toPublicView(record, todayIso(now)) : null;
}
