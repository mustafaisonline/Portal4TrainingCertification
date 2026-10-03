"use server";

import { headers } from "next/headers";
import { getPrisma } from "@/db/prisma";
import { sendEmail } from "@/modules/notifications/email";
import { enquiryAcknowledgementMessage, enquiryNotifyAddress, enquiryTeamMessage } from "./emails";
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
 * Every visitor together. Each accepted message sends 2 emails (team notice + acknowledgement) through the free SMTP2GO
 * relay (1,000 emails a month) that registrations and replies share, so a flood must not be able to use up the quota:
 * at most 20 messages an hour and 40 a day portal-wide.
 */
const GLOBAL_PER_HOUR = 20;
const GLOBAL_PER_DAY = 40;
const ONE_DAY = 24 * ONE_HOUR;
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
  // Three independent limits (each atomic): this client, this address, and the whole portal, per hour and per day (the email quota is shared).
  const tooMany = (await enquiryOverLimit("ip", clientKey, TEN_MINUTES, 5)) || (await enquiryOverLimit("email", values.email, ONE_HOUR, 3)) || (await enquiryOverLimit("all", "portal", ONE_HOUR, GLOBAL_PER_HOUR)) || (await enquiryOverLimit("all-day", "portal", ONE_DAY, GLOBAL_PER_DAY));
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

  // The message is safe in the database; mail is best-effort and recorded in the outbox either way.
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
