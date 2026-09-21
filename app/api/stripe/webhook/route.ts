import { InvalidSignatureError, PaymentsNotConfiguredError } from "@/modules/commerce/errors";
import { handleStripeWebhook } from "@/modules/commerce/webhook.service";

/*
 * POST /api/stripe/webhook (M4 plan §2 item 4; §6 commitments 2 and 5).
 * The RAW body is read as text — signature verification is over the exact
 * bytes Stripe sent. 400 for a missing or invalid signature (nothing stored
 * as processed); 200 `{received:true}` once the event is stored and handled
 * or recognised as a duplicate; 500 when processing failed (the event row
 * says `failed`; Stripe retries).
 */
export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "missing stripe-signature header" }, { status: 400 });
  }
  const rawBody = await req.text();
  try {
    const outcome = await handleStripeWebhook(rawBody, signature);
    return Response.json({ received: true, duplicate: outcome.duplicate, status: outcome.status });
  } catch (err) {
    if (err instanceof InvalidSignatureError) {
      console.warn("[commerce] webhook rejected:", err.message);
      return Response.json({ error: "invalid signature" }, { status: 400 });
    }
    if (err instanceof PaymentsNotConfiguredError) {
      console.error("[commerce] webhook received but", err.message);
      return Response.json({ error: "payments not configured" }, { status: 500 });
    }
    console.error("[commerce] webhook processing failed", err);
    return Response.json({ error: "processing failed" }, { status: 500 });
  }
}
