import { getPrisma } from "@/db/prisma";
import { agenticPassEndingMessage } from "@/modules/commerce/emails";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { sendEmail } from "@/modules/notifications/email";
import { PASS_LABEL, type PassPlan } from "./products";

/*
 * "We email you before a plan ends" (CR-2026-10-04-0113; Agentic AI terms §6). Run daily with the other reminders. A plan that
 * ends within the next 30 days and has NOT already been renewed (no later pass of the same plan for the person) gets ONE email —
 * the outbox's idempotency key (`pass-ending:<passId>`) makes a repeat run, or a retry, send nothing more.
 */

export const PASS_REMINDER_DAYS = 30;

export async function runPassEndingReminders(now: Date = new Date()): Promise<{ considered: number; queued: number }> {
  const prisma = getPrisma();
  const horizon = new Date(now.getTime() + PASS_REMINDER_DAYS * 86_400_000);
  const ending = await prisma.accessPass.findMany({ where: { endsAt: { gt: now, lte: horizon } }, select: { id: true, userId: true, plan: true, endsAt: true, user: { select: { email: true, name: true } } } });
  let queued = 0;
  for (const p of ending) {
    const renewed = await prisma.accessPass.count({ where: { userId: p.userId, plan: p.plan, startsAt: { gte: p.endsAt } } });
    if (renewed > 0) continue;
    try {
      const sent = await sendEmail({
        idempotencyKey: `pass-ending:${p.id}`,
        ...agenticPassEndingMessage({ to: p.user.email, name: p.user.name, planLabel: PASS_LABEL[p.plan as PassPlan] ?? p.plan, endsOn: p.endsAt.toISOString().slice(0, 10), renewUrl: `${appBaseUrl()}/subscription` }),
      });
      if (sent.status !== "failed") queued += 1;
    } catch (err) {
      console.error(`[agentic] pass-ending email failed for pass ${p.id}`, err instanceof Error ? err.message : err);
    }
  }
  return { considered: ending.length, queued };
}
