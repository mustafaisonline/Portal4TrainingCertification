import { getPrisma, withTransaction } from "@/db/prisma";
import { findOfferingById, MODALITY_LABEL, type OfferingRecord } from "@/modules/catalogue/offerings/repository";
import { findProgrammeBySlug } from "@/modules/catalogue/programmes/repository";
import type { ProgrammePriceRecord, ProgrammeRecord } from "@/modules/catalogue/programmes/types";
import { publishedDocuments, refundDocumentVersion } from "@/modules/identity/legal-documents";
import { getProfile, isCompleteForCheckout, missingForCheckout } from "@/modules/identity/profile.repository";
import { findUserById } from "@/modules/identity/users.repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import { formatDateRange } from "@/shared/util/dates";
import { countSeatsTaken, lockOfferingForSeat, ORDER_HOLD_MINUTES, startsInFuture } from "./capacity";
import { CommerceError, PaymentsNotConfiguredError } from "./errors";
import { priceForUser } from "./pricing";
import { paymentsConfigured, stripeGateway, type PaymentGateway } from "./stripe";

/*
 * Checkout (M4 plan §2 item 3; §6 commitments 1, 3, 6). One call creates the
 * pending order that HOLDS a seat, records consent, writes the audit row —
 * all in ONE transaction under a lock on the offering row — and then asks
 * Stripe for a hosted Checkout Session. The browser is redirected to Stripe;
 * it never sees an amount it could change, and no registration exists until
 * the webhook confirms payment (webhook.service.ts).
 */

export type StartCheckoutInput = {
  userId: string;
  offeringId: string;
  /** The person ticked the consent box. Not stored as a field: what is stored
   *  is the `consents` rows for the published document versions. */
  consent: boolean;
  gateway?: PaymentGateway;
  /** Injectable clock for tests. */
  now?: Date;
};

export type StartCheckoutResult = { orderId: string; url: string };

export function appBaseUrl(): string {
  const raw = process.env["APP_BASE_URL"];
  if (!raw) throw new Error("APP_BASE_URL is not set — checkout needs absolute return URLs for Stripe.");
  return raw.replace(/\/+$/, "");
}

/** "<programme> — <format or modality> — <dates>": the line item Stripe
 *  shows and the receipt names. */
export function describeOfferingForStripe(offering: OfferingRecord): string {
  return `${offering.programmeTitle} — ${offering.format?.name ?? MODALITY_LABEL[offering.modality]} — ${formatDateRange(offering.startsOn, offering.endsOn)}`;
}

export async function startCheckout(input: StartCheckoutInput): Promise<StartCheckoutResult> {
  if (!input.consent) {
    throw new CommerceError("consent_required", "Consent to the Terms, Privacy and Refund policies is required to pay.");
  }
  const documents = publishedDocuments();
  if (!documents) {
    throw new CommerceError("documents_unpublished", "No legal document versions are published; nothing can be consented to.");
  }
  // Fail before holding a seat when there is nothing to hand the person to.
  if (!input.gateway && !paymentsConfigured()) throw new PaymentsNotConfiguredError("STRIPE_SECRET_KEY");
  const gateway = input.gateway ?? stripeGateway();
  const baseUrl = appBaseUrl();
  const now = input.now ?? new Date();

  const user = await findUserById(input.userId);
  if (!user) throw new Error(`user ${input.userId} not found`);
  // The profile gate (M5a plan §2 item 4), enforced here as well as on the
  // checkout screen so a direct action call cannot bypass it. The pricing
  // region comes from the ISO country on the profile (item 5), falling back
  // to the legacy free-text country only for rows that predate the profile.
  const profile = await getProfile(user.id);
  if (!isCompleteForCheckout(profile)) {
    throw new CommerceError("profile_incomplete", `User ${user.id} is missing profile details: ${missingForCheckout(profile).join(", ")}.`);
  }
  const pricingCountry = profile?.countryCode ?? user.country;

  const { order, offering } = await withTransaction(async (tx) => {
    const { offering } = await lockOfferingForSeat(tx, input.offeringId, now);

    const confirmed = await tx.registration.findFirst({
      where: { userId: user.id, offeringId: offering.id, status: "confirmed" },
      select: { id: true },
    });
    if (confirmed) throw new CommerceError("already_registered", `User ${user.id} already holds registration ${confirmed.id}.`);
    // M6: only a REGISTRATION order pending for this offering blocks another;
    // a certificate-renewal order also carries the offering id (plan §4).
    const pending = await tx.order.findFirst({
      where: { userId: user.id, offeringId: offering.id, kind: "registration", status: "pending", expiresAt: { gt: now } },
      select: { id: true },
    });
    if (pending) throw new CommerceError("order_pending", `User ${user.id} already has pending order ${pending.id} for this offering.`);

    const programme = await findProgrammeBySlug(offering.programmeSlug, tx);
    if (!programme) throw new Error(`programme ${offering.programmeSlug} not found`);
    const price = priceForUser(programme, { country: pricingCountry });

    const expiresAt = new Date(now.getTime() + ORDER_HOLD_MINUTES * 60_000);
    const order = await tx.order.create({
      data: {
        userId: user.id,
        offeringId: offering.id,
        programmeId: offering.programmeId,
        status: "pending",
        region: price.region,
        currency: price.currency,
        amountMinor: BigInt(price.offerAmountMinor),
        expiresAt,
      },
    });
    // Consent at purchase (plan §5): Terms, Privacy and the Refund policy at
    // their published versions. A version already accepted is not duplicated.
    await tx.consent.createMany({
      data: [
        { userId: user.id, documentKey: "terms", documentVersion: documents.terms },
        { userId: user.id, documentKey: "privacy", documentVersion: documents.privacy },
        { userId: user.id, documentKey: "refund", documentVersion: refundDocumentVersion(documents) },
      ],
      skipDuplicates: true,
    });
    await writeAudit(tx, {
      actorUserId: user.id,
      action: "order.created",
      entityType: "order",
      entityId: order.id,
      after: {
        offeringId: offering.id,
        programmeId: offering.programmeId,
        region: price.region,
        currency: price.currency,
        amountMinor: price.offerAmountMinor,
        expiresAt: expiresAt.toISOString(),
        consented: { terms: documents.terms, privacy: documents.privacy, refund: refundDocumentVersion(documents) },
      },
    });
    return { order, offering };
  });

  // Outside the database transaction: a network call must not hold row locks.
  const prisma = getPrisma();
  try {
    const session = await gateway.createCheckoutSession({
      orderId: order.id,
      amountMinor: Number(order.amountMinor),
      currency: order.currency,
      productName: describeOfferingForStripe(offering),
      customerEmail: user.email,
      expiresAt: order.expiresAt,
      successUrl: `${baseUrl}/account/programmes?order=${order.id}`,
      cancelUrl: `${baseUrl}/checkout/${offering.id}?cancelled=1`,
    });
    await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id } });
    return { orderId: order.id, url: session.url };
  } catch (err) {
    // The hold is released immediately rather than after 30 minutes.
    await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } });
    console.error(`[commerce] Stripe Checkout Session creation failed for order ${order.id}`, err);
    throw err;
  }
}

/* ------------------------------------------------------- read-only preview */

export type CheckoutPreview =
  | {
      ok: true;
      offering: OfferingRecord;
      programme: ProgrammeRecord;
      price: ProgrammePriceRecord;
      seatsLeft: number | null;
    }
  | { ok: false; reason: "offering_not_found" }
  | {
      ok: false;
      reason: "offering_not_open" | "offering_started" | "offering_full" | "already_registered" | "order_pending" | "no_price_for_region";
      offering: OfferingRecord;
    };

/** What the checkout screen shows before the person acts. Read-only and
 *  unlocked — the authoritative checks run again inside `startCheckout`.
 *  `user.country` is the pricing country: the profile's ISO code when there
 *  is one (the page resolves it), else the legacy free-text value. */
export async function previewCheckout(offeringId: string, user: { id: string; country: string | null }, now = new Date()): Promise<CheckoutPreview> {
  const prisma = getPrisma();
  const offering = await findOfferingById(offeringId);
  if (!offering) return { ok: false, reason: "offering_not_found" };
  if (offering.status !== "open") return { ok: false, reason: "offering_not_open", offering };
  if (!startsInFuture(offering, now)) return { ok: false, reason: "offering_started", offering };

  const confirmed = await prisma.registration.findFirst({ where: { userId: user.id, offeringId, status: "confirmed" }, select: { id: true } });
  if (confirmed) return { ok: false, reason: "already_registered", offering };
  const pending = await prisma.order.findFirst({
    where: { userId: user.id, offeringId, kind: "registration", status: "pending", expiresAt: { gt: now } },
    select: { id: true },
  });
  if (pending) return { ok: false, reason: "order_pending", offering };

  const seats = await withTransaction((tx) => countSeatsTaken(tx, offeringId, now));
  const seatsLeft = offering.capacity === null ? null : Math.max(0, offering.capacity - seats.taken);
  if (seatsLeft === 0) return { ok: false, reason: "offering_full", offering };

  const programme = await findProgrammeBySlug(offering.programmeSlug);
  if (!programme) return { ok: false, reason: "offering_not_found" };
  let price: ProgrammePriceRecord;
  try {
    price = priceForUser(programme, user);
  } catch (err) {
    if (err instanceof CommerceError && err.code === "no_price_for_region") return { ok: false, reason: "no_price_for_region", offering };
    throw err;
  }
  return { ok: true, offering, programme, price, seatsLeft };
}
