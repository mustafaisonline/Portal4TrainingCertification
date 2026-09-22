import Stripe from "stripe";
import { InvalidSignatureError, PaymentsNotConfiguredError } from "./errors";

/*
 * The Stripe boundary (ADR-014; M4 plan §4.1, §6 commitment 5). Everything
 * that talks to Stripe goes through the small `PaymentGateway` interface so
 * the services can be exercised with a fake in tests, and the ONLY Stripe SDK
 * call a test makes is the official signature helper that builds a test
 * event header.
 *
 * The client is constructed lazily from STRIPE_SECRET_KEY. With the key
 * absent it THROWS `PaymentsNotConfiguredError` — the checkout screen shows
 * "payments are not configured"; nothing pretends to succeed (commitment 6).
 * The secret exists server-side only; this module must never be imported by
 * a Client Component.
 */

export type CheckoutSessionInput = {
  orderId: string;
  /** Integer minor units (sen / paisa / cents). */
  amountMinor: number;
  /** ISO 4217, upper-case as stored; lower-cased for Stripe here. */
  currency: string;
  productName: string;
  customerEmail: string;
  expiresAt: Date;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSessionResult = { id: string; url: string };

export type RefundInput = {
  paymentIntentId: string;
  amountMinor: number;
  metadata: Record<string, string>;
};

/** Stripe's refund states, narrowed to what the product records. */
export type RefundResult = { id: string; status: "pending" | "succeeded" | "failed" };

/** The provider's non-recoverable processing fee for a settled payment,
 *  expressed in minor units of the CHARGE currency. */
export type ProcessingFee = { feeMinor: number; currency: string };

export interface PaymentGateway {
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;
  createRefund(input: RefundInput): Promise<RefundResult>;
  /** Null when the balance transaction is not available yet (or the fee
   *  cannot be expressed in the charge currency). */
  retrieveProcessingFee(paymentIntentId: string): Promise<ProcessingFee | null>;
  /** Verifies the `stripe-signature` header against the raw body and returns
   *  the event; throws `InvalidSignatureError` when it does not verify. */
  constructEvent(rawBody: string, signature: string): Stripe.Event;
}

function requireEnv(name: "STRIPE_SECRET_KEY" | "STRIPE_WEBHOOK_SECRET"): string {
  const value = process.env[name];
  if (!value) throw new PaymentsNotConfiguredError(name);
  return value;
}

/** True when both Stripe secrets are present — for screens that must say
 *  "not configured" before a person fills anything in. */
export function paymentsConfigured(): boolean {
  return Boolean(process.env["STRIPE_SECRET_KEY"]);
}

export function mapRefundStatus(status: string | null | undefined): RefundResult["status"] {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "failed":
    case "canceled":
      return "failed";
    default:
      return "pending";
  }
}

/** Signature verification through the SDK, with the SDK's error translated
 *  into ours. Exported so a test's fake gateway verifies real signatures. */
export function verifyStripeSignature(rawBody: string, signature: string, secret: string): Stripe.Event {
  try {
    return Stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
      throw new InvalidSignatureError(err.message);
    }
    throw err;
  }
}

export class StripeGateway implements PaymentGateway {
  private client: Stripe | null = null;

  private stripe(): Stripe {
    return (this.client ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
      appInfo: { name: "Data & AI Academy Portal", version: "0.1.0" },
    }));
  }

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
    const session = await this.stripe().checkout.sessions.create(
      {
        mode: "payment",
        // Founder decision 2026-09-21: cards only for now. FPX / GrabPay need
        // enabling in the Stripe Dashboard first (no bank API is involved);
        // when that happens, remove this line and Checkout offers whatever
        // the Dashboard has enabled.
        payment_method_types: ["card"],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency.toLowerCase(),
              unit_amount: input.amountMinor,
              product_data: { name: input.productName },
            },
          },
        ],
        customer_email: input.customerEmail,
        client_reference_id: input.orderId,
        metadata: { orderId: input.orderId },
        expires_at: Math.floor(input.expiresAt.getTime() / 1000),
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      },
      // One order → at most one session, even if the request is retried.
      { idempotencyKey: `order:${input.orderId}:checkout-session` },
    );
    if (!session.url) throw new Error(`Stripe returned Checkout Session ${session.id} without a URL`);
    return { id: session.id, url: session.url };
  }

  async createRefund(input: RefundInput): Promise<RefundResult> {
    const refund = await this.stripe().refunds.create(
      { payment_intent: input.paymentIntentId, amount: input.amountMinor, metadata: input.metadata },
      { idempotencyKey: `refund:${input.metadata["refundId"] ?? input.paymentIntentId}:${input.amountMinor}` },
    );
    return { id: refund.id, status: mapRefundStatus(refund.status) };
  }

  async retrieveProcessingFee(paymentIntentId: string): Promise<ProcessingFee | null> {
    const intent = await this.stripe().paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge.balance_transaction"],
    });
    const charge = intent.latest_charge;
    if (!charge || typeof charge === "string") return null;
    const bt = charge.balance_transaction;
    if (!bt || typeof bt === "string") return null;
    const chargeCurrency = charge.currency.toUpperCase();
    // The fee is reported in the SETTLEMENT currency (MYR for this account).
    // For a charge in another currency Stripe supplies the exchange rate it
    // applied (settlement per unit of charge currency); convert back.
    if (bt.currency.toUpperCase() === chargeCurrency) return { feeMinor: bt.fee, currency: chargeCurrency };
    if (bt.exchange_rate && bt.exchange_rate > 0) return { feeMinor: Math.round(bt.fee / bt.exchange_rate), currency: chargeCurrency };
    return null;
  }

  constructEvent(rawBody: string, signature: string): Stripe.Event {
    return verifyStripeSignature(rawBody, signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
  }
}

let defaultGateway: PaymentGateway | null = null;

/** The real gateway — one per process. Services take an optional gateway
 *  parameter and fall back to this. */
export function stripeGateway(): PaymentGateway {
  return (defaultGateway ??= new StripeGateway());
}

export type { Stripe };
