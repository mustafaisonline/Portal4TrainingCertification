import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";

/*
 * In-app notifications (CR-2026-10-03-1228) — the data side. Every read and
 * write is scoped to ONE person (`userId`): nobody can read, mark or count
 * another person's notifications through these functions. Rows hold a title, a
 * short sentence and a same-site path — never a one-time link or a secret.
 */

export const NOTIFICATION_KINDS = ["registration", "payment", "interest", "assessment", "certificate", "enquiry", "system"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
  registration: "Registrations",
  payment: "Payments",
  interest: "Interest",
  assessment: "Assessment",
  certificate: "Certificates",
  enquiry: "Messages",
  system: "Account",
};
export const NOTIFICATIONS_PAGE_SIZE = 20;
export const BELL_LATEST = 5;

export type NotificationRecord = { id: string; kind: NotificationKind; title: string; body: string; link: string | null; read: boolean; createdAt: Date };

// A plain same-site path: no scheme, no host, no protocol-relative form, no control characters.
const LINK_RE = /^\/(?!\/)[A-Za-z0-9\-._~/?=&%#]{0,199}$/;
export function isSafeLink(link: string | null | undefined): link is string {
  return typeof link === "string" && LINK_RE.test(link);
}
export function isNotificationKind(value: string): value is NotificationKind {
  return (NOTIFICATION_KINDS as readonly string[]).includes(value);
}

export type NewNotification = { userId: string; kind: NotificationKind; title: string; body: string; link?: string | null; dedupeKey?: string | null };

/** Creates a notification; the same `dedupeKey` for the same person is ignored (an event notifies once). Returns whether a row was created. */
export async function createNotification(input: NewNotification, db: Db = getPrisma()): Promise<boolean> {
  const result = await db.notification.createMany({
    data: [{ userId: input.userId, kind: input.kind, title: input.title.trim().slice(0, 200), body: input.body.trim().slice(0, 500), link: isSafeLink(input.link) ? input.link : null, dedupeKey: input.dedupeKey ?? null }],
    skipDuplicates: true,
  });
  return result.count === 1;
}

const toRecord = (r: { id: string; kind: string; title: string; body: string; link: string | null; readAt: Date | null; createdAt: Date }): NotificationRecord => ({
  id: r.id,
  kind: isNotificationKind(r.kind) ? r.kind : "system",
  title: r.title,
  body: r.body,
  link: r.link,
  read: r.readAt !== null,
  createdAt: r.createdAt,
});

export async function unreadCount(userId: string, db: Db = getPrisma()): Promise<number> {
  return db.notification.count({ where: { userId, readAt: null } });
}

export async function latestNotifications(userId: string, n: number = BELL_LATEST, db: Db = getPrisma()): Promise<NotificationRecord[]> {
  const rows = await db.notification.findMany({ where: { userId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: n });
  return rows.map(toRecord);
}

export type NotificationFilter = "all" | "unread" | NotificationKind;
export async function listNotifications(userId: string, opts: { filter?: NotificationFilter; page?: number } = {}, db: Db = getPrisma()) {
  const filter = opts.filter ?? "all";
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const where = { userId, ...(filter === "unread" ? { readAt: null } : filter !== "all" ? { kind: filter } : {}) };
  const [total, rows, unread] = await Promise.all([
    db.notification.count({ where }),
    db.notification.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * NOTIFICATIONS_PAGE_SIZE, take: NOTIFICATIONS_PAGE_SIZE }),
    unreadCount(userId, db),
  ]);
  return { items: rows.map(toRecord), total, unread, page, pageCount: Math.max(1, Math.ceil(total / NOTIFICATIONS_PAGE_SIZE)) };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const onlyUuids = (ids: readonly string[]) => ids.filter((id) => UUID_RE.test(id)).slice(0, 100);

/** Marks the person's OWN notifications read/unread; ids that are not theirs change nothing. Returns how many rows changed. */
export async function setRead(userId: string, ids: readonly string[], read: boolean, db: Db = getPrisma()): Promise<number> {
  const safe = onlyUuids(ids);
  if (safe.length === 0) return 0;
  const result = await db.notification.updateMany({ where: { userId, id: { in: safe }, readAt: read ? null : { not: null } }, data: { readAt: read ? new Date() : null } });
  return result.count;
}

export async function markAllRead(userId: string, db: Db = getPrisma()): Promise<number> {
  return (await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } })).count;
}

/** Retention: read notifications older than the cutoff are removed; unread ones are kept until read. */
export async function purgeReadBefore(cutoff: Date, db: Db = getPrisma()): Promise<number> {
  return (await db.notification.deleteMany({ where: { readAt: { not: null }, createdAt: { lt: cutoff } } })).count;
}
