import { getPrisma } from "@/db/prisma";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { sendEmail } from "@/modules/notifications/email";
import { EMAIL_SIGN_OFF } from "@/modules/notifications/sign-off";

/*
 * Emails to the administrators when a Trainer finishes something that needs their approval
 * (CR-2026-10-03-2254; founder, 2026-10-04: "when trainer is done creating new training and then schedule, both time email
 * notification should go to admin, Admin should login and give approval"). Sent to each active platform administrator's own
 * account address — the portal never prints an address — after the change is saved, and never able to fail it.
 * One email per administrator per event (idempotency key). Trainer-typed text (the training title) is flattened to one line
 * and shortened, so it cannot add header lines or a long preface.
 */

const oneLine = (t: string, max = 120) => t.replace(/\s+/g, " ").trim().slice(0, max);

async function administrators(): Promise<{ id: string; name: string; email: string }[]> {
  const rows = await getPrisma().userRole.findMany({ where: { role: "platform_admin", revokedAt: null }, select: { user: { select: { id: true, name: true, email: true } } }, distinct: ["userId"] });
  return rows.map((r) => r.user);
}

async function emailAdministrators(input: { key: string; templateKey: string; subject: string; body: (name: string) => string }): Promise<void> {
  for (const admin of await administrators()) {
    await sendEmail({ to: admin.email, templateKey: input.templateKey, subject: oneLine(input.subject, 160), text: input.body(admin.name) + EMAIL_SIGN_OFF, idempotencyKey: `${input.key}:${admin.id}` });
  }
}

/** A Trainer pressed "Submit for review" on a finished draft. */
export async function emailAdminsReviewRequested(input: { programmeId: string; title: string; bucket: number }): Promise<void> {
  const title = oneLine(input.title);
  await emailAdministrators({
    key: `admin-review:${input.programmeId}:${input.bucket}`,
    templateKey: "admin.review-requested",
    subject: `Training ready for your review: ${title}`,
    body: (name) =>
      `Hello ${oneLine(name, 80)},\n\nA trainer has finished the training "${title}" and asks you to review it and publish it.\n\n` +
      `Sign in as an administrator and open it here:\n${appBaseUrl()}/admin/trainings/${input.programmeId}\n\n` +
      `It is not public until you publish it.`,
  });
}

/** A Trainer scheduled a date. */
export async function emailAdminsDateScheduled(input: { offeringId: string; programmeTitle: string | null; startsOn: string }): Promise<void> {
  const title = oneLine(input.programmeTitle ?? "a training");
  await emailAdministrators({
    key: `admin-date:${input.offeringId}`,
    templateKey: "admin.date-scheduled",
    subject: `A trainer scheduled a date: ${title}`,
    body: (name) =>
      `Hello ${oneLine(name, 80)},\n\nA trainer scheduled a date for "${title}" starting ${input.startsOn}. It is waiting for your approval: it is hidden from the public until you set it to Planned or Open.\n\n` +
      `Sign in as an administrator and review it here:\n${appBaseUrl()}/admin/offerings/${input.offeringId}`,
  });
}
