"use server";

import { headers } from "next/headers";
import { getPrisma } from "@/db/prisma";
import { sendEmail } from "@/modules/notifications/email";
import { notifyAdmins } from "@/modules/notifications/notifications.service";
import { enquiryAcknowledgementMessage, enquiryNotifyAddress, enquiryTeamMessage, kindLabel } from "./emails";
import { enquiryReference, validateEnquiryForm, type EnquiryField } from "./enquiry-validation";
import { clientKeyOf, enquiryOverLimit } from "./rate-limit";
import { createEnquiry } from "./repository";

/*
 * Contact Us — a server action (ADR-004; CR-2026-10-03-1226). Validates, writes
 * the `enquiries` row FIRST (so a mail failure never loses a message), then
 * emails the team and acknowledges the sender through the outbox. The client
 * never fabricates success.
 *
 * Abuse: a honeypot (answered with the same "sent" screen, nothing stored),
 * 5 messages per client per 10 minutes and 3 per address per hour, both
 * counted in the database.
 */

export type EnquiryFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Partial<Record<EnquiryField, string>> }
  | { status: "sent"; reference: string };

const TEN_MINUTES = 10 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
/**
 * Portal-wide EMAIL caps (security review, MEDIUM). Each accepted message sends 2 emails (team notice + acknowledgement)
 * through the free SMTP2GO relay (1,000 emails a month) that registrations and replies share. These caps decide ONLY
 * whether those two emails are sent — never whether the message is stored — so a flood can neither discard a real
 * enquiry nor lock everyone out of the form: the admin inbox always has the message. Per-visitor limits (below) decide
 * whether a message is accepted at all.
 */
const EMAIL_CAP_PER_HOUR = 20;
const EMAIL_CAP_PER_DAY = 40;
const EMAIL_CAP_PER_30_DAYS = 300; // 300 messages = 600 emails, leaving headroom of the monthly 1,000 for sign-up and replies
const ONE_DAY = 24 * ONE_HOUR;
const THIRTY_DAYS = 30 * ONE_DAY;
const SOURCE_PATH_RE = /^\/[A-Za-z0-9\-._~/?=&%]{0,199}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clean(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function submitEnquiry(_prev: EnquiryFormState, formData: FormData): Promise<EnquiryFormState> {
  const checked = validateEnquiryForm({
    name: clean(formData.get("name")),
    email: clean(formData.get("email")),
    organisation: clean(formData.get("organisation")),
    message: clean(formData.get("message")),
    kind: clean(formData.get("kind")),
    trap: clean(formData.get("hp_ref_code")),
  });
  // A bot gets the same screen as a person; nothing is stored or sent.
  if (checked.kind === "bot") return { status: "sent", reference: "—" };
  if (checked.kind === "invalid") return { status: "error", message: "Please check the highlighted fields.", fieldErrors: checked.fieldErrors };
  const { values } = checked;

  const h = await headers();
  const clientKey = clientKeyOf((h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0]!);
  // Per-visitor limits (each atomic) decide whether the message is ACCEPTED: this client and this address.
  const tooMany = (await enquiryOverLimit("ip", clientKey, TEN_MINUTES, 5)) || (await enquiryOverLimit("email", values.email, ONE_HOUR, 3));
  if (tooMany) return { status: "error", message: "Too many messages in a short time. Please try again in a few minutes.", fieldErrors: {} };

  // The training the page was about, when it is a real one.
  const prisma = getPrisma();
  const programmeRaw = clean(formData.get("programmeId")).trim();
  const programme = UUID_RE.test(programmeRaw) ? await prisma.programme.findUnique({ where: { id: programmeRaw }, select: { id: true, title: true } }) : null;
  // A plain site path only (no control characters, backslashes or protocol-relative forms) — it is printed in the team email and the admin screen.
  const requested = clean(formData.get("sourcePath")).trim();
  const sourcePath = SOURCE_PATH_RE.test(requested) && !requested.startsWith("//") ? requested : "/contact-us";

  const enquiry = await createEnquiry({
    kind: values.kind,
    name: values.name,
    email: values.email,
    organisation: values.organisation,
    message: values.message,
    programmeId: programme?.id ?? null,
    sourcePath,
  });
  const reference = enquiryReference(enquiry.id);
  const base = (process.env["APP_BASE_URL"] ?? "http://localhost:3100").replace(/\/+$/, "");

  // Tell the administrators in-app (their bell) — independent of any email; never able to fail the submission.
  void notifyAdmins({ kind: "enquiry", title: `New message from ${values.name}`, body: `${kindLabel(values.kind)}${programme?.title ? ` — ${programme.title}` : ""}. Reference ${reference}.`, link: `/admin/enquiries/${enquiry.id}`, dedupeKey: `enquiry:${enquiry.id}` }).catch((err) => console.error("[notifications] admin notice failed for", reference, err));

  // The message is safe in the database. The portal-wide caps now decide only whether the two emails go out (each counts,
  // so every accepted message is counted once); over a cap the team simply reads it in Admin → Enquiries.
  const overHour = await enquiryOverLimit("all", "portal", ONE_HOUR, EMAIL_CAP_PER_HOUR);
  const overDay = await enquiryOverLimit("all-day", "portal", ONE_DAY, EMAIL_CAP_PER_DAY);
  const overMonth = await enquiryOverLimit("all-month", "portal", THIRTY_DAYS, EMAIL_CAP_PER_30_DAYS);
  if (overHour || overDay || overMonth) {
    console.warn(`[enquiries] portal-wide email cap reached (${overHour ? "hour" : overDay ? "day" : "30 days"}): ${reference} is stored and visible in Admin, no email was sent`);
    return { status: "sent", reference };
  }

  // Mail is best-effort and recorded in the outbox either way.
  const sent = await Promise.allSettled([
    sendEmail(
      enquiryTeamMessage({
        to: enquiryNotifyAddress(),
        reference,
        adminUrl: `${base}/admin/enquiries/${enquiry.id}`,
        name: values.name,
        email: values.email,
        organisation: values.organisation,
        kind: values.kind,
        programmeTitle: programme?.title ?? null,
        sourcePath,
        message: values.message,
      }),
    ),
    sendEmail(enquiryAcknowledgementMessage({ to: values.email, reference })),
  ]);
  for (const r of sent) if (r.status === "rejected") console.error("[enquiries] email could not be recorded for", reference, r.reason);

  return { status: "sent", reference };
}
