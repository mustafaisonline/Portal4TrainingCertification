import { getPrisma } from "@/db/prisma";
import type { EmailMessage } from "./email";
import { createNotification, type NotificationKind } from "./notifications.repository";

/*
 * Turning events into in-app notifications (CR-2026-10-03-1228).
 *
 * `notifyFromEmail` is called by `sendEmail` for every message the portal sends:
 * a message whose template is in the allow-list below also becomes a
 * notification for the person it was addressed to (matched by their account
 * email). The allow-list is deliberate — a verification or password-reset email
 * carries a one-time link and must NEVER be copied into a notification; only
 * events a person would want in their bell are listed, each with a fixed
 * sentence (the email body is never copied).
 *
 * A notification is created whether or not the email was delivered: the in-app
 * channel does not depend on mail. Nothing here may break the event that caused
 * it — callers swallow and log any failure.
 */

type Spec = { kind: NotificationKind; body: string; link: string };

const FROM_EMAIL: Record<string, Spec> = {
  "commerce.registration-confirmed": { kind: "registration", body: "Your registration is confirmed. Open My Trainings for the details.", link: "/account/trainings" },
  "commerce.registration-cancelled": { kind: "registration", body: "Your registration was cancelled. Your refund, if any, is in Orders & receipts.", link: "/account/trainings" },
  "commerce.registration-transferred": { kind: "registration", body: "Your registration was moved to a new date.", link: "/account/trainings" },
  "commerce.agentic-pass-ending": { kind: "payment", body: "Your plan ends soon. Renew to keep unlimited access.", link: "/subscription" },
  "commerce.agentic-purchase": { kind: "payment", body: "Your Agentic AI purchase is ready to download.", link: "/account/downloads" },
  "commerce.interest-registered-free": { kind: "interest", body: "Your interest is registered. The trainer will tell you when a date opens.", link: "/account/trainings#interests" },
  "commerce.interest-registered": { kind: "interest", body: "Your interest is registered. The trainer will tell you when a date opens.", link: "/account/trainings#interests" },
  "commerce.support-received": { kind: "payment", body: "Thank you — your support payment was received.", link: "/account/orders" },
  "commerce.knowledge-check-unlocked": { kind: "assessment", body: "Your Certificate of Achievement is unlocked.", link: "/assessment" }, // DR-05: a PASSED free check may be called a "Certificate of Achievement" — never a Certificate of Completion or the Academy's credential (DR-01)
  "certificate.issued": { kind: "certificate", body: "Your certificate was issued. It is listed under Certifications.", link: "/account/certifications" },
  "certificate.renewed": { kind: "certificate", body: "Your certificate was renewed.", link: "/account/certifications" },
  "certificate.reminder.before_30": { kind: "certificate", body: "A certificate expires in about 30 days — you can renew it.", link: "/account/certifications" },
  "certificate.reminder.before_7": { kind: "certificate", body: "A certificate expires within 7 days — you can renew it.", link: "/account/certifications" },
  "certificate.reminder.on_expiry": { kind: "certificate", body: "A certificate expires today.", link: "/account/certifications" },
  "certificate.reminder.after_expiry": { kind: "certificate", body: "A certificate has expired — you can renew it.", link: "/account/certifications" },
};

/** The templates that become notifications (exported for the test that guards the allow-list). */
export const NOTIFIABLE_TEMPLATES = Object.keys(FROM_EMAIL);
export const NOTIFICATION_SPECS: Readonly<Record<string, Spec>> = FROM_EMAIL;

export async function notifyFromEmail(message: Pick<EmailMessage, "to" | "templateKey" | "subject">, outboxId: string): Promise<boolean> {
  const spec = FROM_EMAIL[message.templateKey];
  if (!spec) return false;
  const user = await getPrisma().user.findUnique({ where: { email: message.to.trim().toLowerCase() }, select: { id: true } });
  if (!user) return false; // not (yet) an account — an email-only recipient has no bell
  return createNotification({ userId: user.id, kind: spec.kind, title: message.subject, body: spec.body, link: spec.link, dedupeKey: `email:${outboxId}` });
}

/** An internal notification for every active platform administrator (e.g. a new Contact Us message). */
export async function notifyAdmins(input: { kind: NotificationKind; title: string; body: string; link: string; dedupeKey: string }): Promise<number> {
  const admins = await getPrisma().userRole.findMany({ where: { role: "platform_admin", revokedAt: null }, select: { userId: true }, distinct: ["userId"] });
  let created = 0;
  for (const a of admins) if (await createNotification({ userId: a.userId, kind: input.kind, title: input.title, body: input.body, link: input.link, dedupeKey: input.dedupeKey })) created++;
  return created;
}
