import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/modules/identity/session";
import { NotificationOpenLink } from "@/modules/notifications/components/NotificationOpenLink";
import { markAllNotificationsRead, markNotificationRead, markNotificationUnread } from "@/modules/notifications/notifications.actions";
import { isNotificationKind, listNotifications, NOTIFICATION_KIND_LABEL, NOTIFICATION_KINDS, type NotificationFilter } from "@/modules/notifications/notifications.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";

/*
 * S05 — Notification centre (CR-2026-10-03-1228; founder: "a notification dedicated
 * page … with number of unread notifications"). Replaces the earlier list of
 * outbox emails: this page shows what the portal told the person IN-APP —
 * newest first, unread highlighted, filter (All · Unread · by category),
 * mark read / unread / all, pagination, and a deep link to what each one is about.
 * Their own notifications only (every query is scoped by the signed-in user).
 */
export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireUser("/account/notifications");
  const sp = await searchParams;
  const rawFilter = one(sp["filter"]);
  const filter: NotificationFilter = rawFilter === "unread" ? "unread" : isNotificationKind(rawFilter) ? rawFilter : "all";
  const page = Math.max(1, Number.parseInt(one(sp["page"]) || "1", 10) || 1);
  const { items, total, unread, pageCount } = await listNotifications(user.id, { filter, page });

  const href = (f: string, p = 1) => `/account/notifications?${new URLSearchParams({ ...(f !== "all" ? { filter: f } : {}), ...(p > 1 ? { page: String(p) } : {}) }).toString()}`.replace(/\?$/, "");
  const filters: { key: string; label: string }[] = [{ key: "all", label: "All" }, { key: "unread", label: `Unread${unread > 0 ? ` (${unread})` : ""}` }, ...NOTIFICATION_KINDS.map((k) => ({ key: k, label: NOTIFICATION_KIND_LABEL[k] }))];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-label mb-2 text-[var(--color-primary)]">Notifications</p>
          <h1 className="text-display" data-testid="notifications-title">Your notifications</h1>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]" data-testid="notifications-summary">
            {unread > 0 ? `${unread} unread` : "Nothing unread"} · {total} {filter === "all" ? "in total" : "in this view"}
          </p>
        </div>
        {unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="secondary" data-testid="mark-all-read">
              Mark all as read
            </Button>
          </form>
        ) : null}
      </header>

      <nav aria-label="Filter notifications" className="flex flex-wrap gap-2" data-testid="notification-filters">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={href(f.key)}
            aria-current={filter === f.key ? "page" : undefined}
            className={`text-body-sm rounded-full border px-3 py-1 ${filter === f.key ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 font-medium text-[var(--color-ink)]" : "border-[var(--color-line-strong)] text-[var(--color-ink-quiet)] hover:border-[var(--color-primary)]"}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <Card variant="panel" className="p-6" data-testid="notifications-empty">
          <p className="text-body-lg font-medium">{filter === "unread" ? "You are all caught up." : "No notifications here yet."}</p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">When you register, pay, register your interest or earn a certificate, it will appear here and in the bell at the top of the page.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3" data-testid="notification-list">
          {items.map((n) => (
            <li key={n.id} data-testid="notification-row" data-read={n.read ? "true" : "false"}>
              <Card variant="panel" className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between ${n.read ? "" : "border-l-4 border-l-[var(--color-primary)]"}`}>
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {n.read ? null : <Chip tone="primary">New</Chip>}
                    <Chip tone="neutral">{NOTIFICATION_KIND_LABEL[n.kind]}</Chip>
                    <span className="text-body-sm text-[var(--color-ink-faint)]">{formatTimestamp(n.createdAt)}</span>
                  </div>
                  <p className={`text-body ${n.read ? "" : "font-semibold"}`}>
                    {n.link ? (
                      <NotificationOpenLink id={n.id} href={n.link} read={n.read}>
                        {n.title}
                      </NotificationOpenLink>
                    ) : (
                      n.title
                    )}
                  </p>
                  <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">{n.body}</p>
                </div>
                <form action={n.read ? markNotificationUnread : markNotificationRead} className="shrink-0">
                  <input type="hidden" name="id" value={n.id} />
                  <Button type="submit" variant="text" data-testid={n.read ? "mark-unread" : "mark-read"}>
                    {n.read ? "Mark as unread" : "Mark as read"}
                  </Button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between" data-testid="notification-pages">
          {page > 1 ? <Link href={href(filter, page - 1)} className="text-[var(--color-primary)] underline underline-offset-4">← Newer</Link> : <span />}
          <span className="text-body-sm text-[var(--color-ink-quiet)]">Page {page} of {pageCount}</span>
          {page < pageCount ? <Link href={href(filter, page + 1)} className="text-[var(--color-primary)] underline underline-offset-4">Older →</Link> : <span />}
        </nav>
      ) : null}
    </div>
  );
}
