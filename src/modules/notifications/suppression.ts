import { getPrisma } from "@/db/prisma";
import { isPlainEmailAddress } from "@/shared/util/email-address";

/*
 * The do-not-send list (CR-2026-10-03-1225 slice 2). An address that bounced or asked not to be written to is
 * checked before EVERY send — verification and reset emails included. Neither the SMTP2GO free relay nor the
 * HostGator mailbox calls us back about bounces, so staff add an address here from the bounce notice (Admin → Email).
 * Addresses are stored lower-cased, so the unique key is case-insensitive in effect.
 */

export const SUPPRESSION_REASON_MAX = 200;

export function normaliseSuppressedAddress(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  return isPlainEmailAddress(v) ? v : null;
}

export async function isSuppressed(email: string): Promise<boolean> {
  const row = await getPrisma().emailSuppression.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
  return row !== null;
}

export type SuppressionRow = { id: string; email: string; reason: string; createdAt: Date };

export async function listSuppressions(): Promise<SuppressionRow[]> {
  return getPrisma().emailSuppression.findMany({ orderBy: { createdAt: "desc" }, take: 500, select: { id: true, email: true, reason: true, createdAt: true } });
}

/** Idempotent: adding an address that is already listed keeps the first entry. Returns the normalised address, or null when it is not a plain address. */
export async function addSuppression(rawEmail: string, reason: string, createdBy: string | null): Promise<{ email: string; created: boolean } | null> {
  const email = normaliseSuppressedAddress(rawEmail);
  if (!email) return null;
  const prisma = getPrisma();
  const existing = await prisma.emailSuppression.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { email, created: false };
  try {
    await prisma.emailSuppression.create({ data: { email, reason: reason.trim().slice(0, SUPPRESSION_REASON_MAX) || "Added by staff", createdBy } });
    return { email, created: true };
  } catch (err) {
    if (typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002") return { email, created: false }; // lost a race to an identical add
    throw err;
  }
}

export async function removeSuppression(id: string): Promise<{ email: string } | null> {
  const prisma = getPrisma();
  const row = await prisma.emailSuppression.findUnique({ where: { id }, select: { email: true } });
  if (!row) return null;
  await prisma.emailSuppression.delete({ where: { id } });
  return { email: row.email };
}
