import { getPrisma } from "@/db/prisma";

/*
 * Admin → Email log (CR-2026-10-03-1225 slice 2). Reads `outbound_emails` WITHOUT the body: verification and reset
 * emails carry one-time links, and an administrator has no need to read them. Recipient, template, subject, status,
 * attempts, the (truncated) error and the times are enough to answer "did it go, and if not why".
 */

export const EMAIL_LOG_STATUSES = ["queued", "sent", "failed"] as const;
export type EmailLogStatus = (typeof EMAIL_LOG_STATUSES)[number];
export const isEmailLogStatus = (v: string): v is EmailLogStatus => (EMAIL_LOG_STATUSES as readonly string[]).includes(v);
export const EMAIL_LOG_PAGE_SIZE = 25;

export type EmailLogFilters = { status?: EmailLogStatus; q?: string; page?: number };
export type EmailLogRow = {
  id: string;
  toEmail: string;
  templateKey: string;
  subject: string;
  status: EmailLogStatus;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  sentAt: Date | null;
  nextAttemptAt: Date | null;
};

export async function listEmailLog(filters: EmailLogFilters): Promise<{ items: EmailLogRow[]; total: number; page: number; pageCount: number }> {
  const prisma = getPrisma();
  const q = filters.q?.trim().slice(0, 100);
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(q ? { OR: [{ toEmail: { contains: q, mode: "insensitive" as const } }, { templateKey: { contains: q, mode: "insensitive" as const } }, { subject: { contains: q, mode: "insensitive" as const } }] } : {}),
  };
  const total = await prisma.outboundEmail.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / EMAIL_LOG_PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Math.floor(filters.page ?? 1)));
  const items = await prisma.outboundEmail.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * EMAIL_LOG_PAGE_SIZE,
    take: EMAIL_LOG_PAGE_SIZE,
    select: { id: true, toEmail: true, templateKey: true, subject: true, status: true, attempts: true, lastError: true, createdAt: true, sentAt: true, nextAttemptAt: true },
  });
  return { items, total, page, pageCount };
}

/** For the page header: how many are waiting for a retry / have failed. */
export async function emailLogCounts(): Promise<{ queued: number; failed: number }> {
  const prisma = getPrisma();
  const [queued, failed] = await Promise.all([prisma.outboundEmail.count({ where: { status: "queued" } }), prisma.outboundEmail.count({ where: { status: "failed" } })]);
  return { queued, failed };
}
