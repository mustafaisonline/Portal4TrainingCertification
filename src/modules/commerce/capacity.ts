import type { Tx } from "@/db/prisma";
import { findOfferingById, type OfferingRecord } from "@/modules/catalogue/offerings/repository";
import { CommerceError } from "./errors";

/*
 * The seat hold (M4 plan §5 "Capacity", §6 commitment 1). Both places that
 * consume a seat — checkout and transfer — go through this ONE function,
 * inside the caller's transaction:
 *
 *   1. `SELECT … FOR UPDATE` on the offering row serialises concurrent
 *      attempts for the same offering (a second transaction waits here until
 *      the first commits or rolls back, then sees its rows).
 *   2. The offering must be `open` and start in the future.
 *   3. seats taken = confirmed registrations + pending orders whose 30-minute
 *      hold has not expired. With `capacity` null nothing is enforced
 *      (capacity "named, not enforced" until it is named — ADR-043).
 */

/** Length of the hold a pending order places on a seat (plan §10 default 2). */
export const ORDER_HOLD_MINUTES = 30;

export type SeatCount = { confirmed: number; pendingHeld: number; taken: number };

export async function countSeatsTaken(tx: Tx, offeringId: string, now: Date): Promise<SeatCount> {
  // Sequential on purpose: a transaction holds ONE connection, and pg
  // deprecates overlapping queries on it.
  const confirmed = await tx.registration.count({ where: { offeringId, status: "confirmed" } });
  // M6: a certificate-renewal order carries the offering id but takes no
  // seat — only registration orders hold one (plan §4 "orders").
  const pendingHeld = await tx.order.count({ where: { offeringId, kind: "registration", status: "pending", expiresAt: { gt: now } } });
  return { confirmed, pendingHeld, taken: confirmed + pendingHeld };
}

export function startsInFuture(offering: { startsOn: Date }, now: Date): boolean {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return offering.startsOn.getTime() > today;
}

/** Locks the offering row, re-reads it under the lock and refuses unless a
 *  seat can be taken now. Returns the offering and the counts. */
export async function lockOfferingForSeat(tx: Tx, offeringId: string, now: Date): Promise<{ offering: OfferingRecord; seats: SeatCount }> {
  const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM scheduled_offerings WHERE id = ${offeringId}::uuid FOR UPDATE`;
  if (locked.length === 0) throw new CommerceError("offering_not_found", `Offering ${offeringId} does not exist.`);
  const offering = await findOfferingById(offeringId, tx);
  if (!offering) throw new CommerceError("offering_not_found", `Offering ${offeringId} does not exist.`);
  if (offering.status !== "open") {
    throw new CommerceError("offering_not_open", `Offering ${offeringId} is ${offering.status}, not open.`);
  }
  if (!startsInFuture(offering, now)) {
    throw new CommerceError("offering_started", `Offering ${offeringId} has already started.`);
  }
  const seats = await countSeatsTaken(tx, offeringId, now);
  if (offering.capacity !== null && seats.taken >= offering.capacity) {
    throw new CommerceError(
      "offering_full",
      `Offering ${offeringId} is full: ${seats.confirmed} confirmed + ${seats.pendingHeld} held of ${offering.capacity}.`,
    );
  }
  return { offering, seats };
}
