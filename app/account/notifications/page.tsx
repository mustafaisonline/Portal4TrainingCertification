import type { Metadata } from "next";
import { listNotificationsForRecipient, NOTIFICATIONS_CAP, type NotificationItem } from "@/modules/certificates/reminders.service";
import { requireUser } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { formatTimestamp } from "@/shared/util/dates";

/*
 * S05 — Notification centre.
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/notifications/
 * page.tsx (ADR-045). Changed: server component on the real session; the
 * static sample list of notification types and the WireframeNote are gone.
 * M7 (plan §2.5): lists the person's outbox messages — subject, when,
 * status — from `outbound_emails` by their address; the empty state stays
 * for a person with none. Never the body: identity messages carry one-time
 * links that must not be re-shown on a page.
 */
export const metadata: Metadata = { title: "Notifications" };

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<NotificationItem["status"], string> = {
  queued: "Queued",
  sent: "Sent",
  failed: "Failed",
};

export default async function NotificationsPage() {
  const user = await requireUser("/account/notifications");
  const items = await listNotificationsForRecipient(user.email);
  const anyQueued = items.some((n) => n.status === "queued");

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Notifications</p>
        <h1 className="text-display">Your notifications</h1>
        {items.length > 0 ? (
          <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
            Messages the Academy has addressed to {user.email}
            {items.length === NOTIFICATIONS_CAP ? ` (the latest ${NOTIFICATIONS_CAP})` : ""}.
            {anyQueued ? " “Queued” means the message is recorded and will be delivered once email sending is enabled." : ""}
          </p>
        ) : null}
      </header>
      {items.length === 0 ? (
        <Card variant="panel" className="p-6 sm:p-8">
          <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="notifications-empty">
            No notifications yet.
          </p>
        </Card>
      ) : (
        <Card variant="panel" className="p-0">
          <ul className="divide-y divide-[var(--color-line)]" data-testid="notification-list">
            {items.map((n) => (
              <li key={n.id} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6" data-testid="notification-row">
                <div className="min-w-0">
                  <p className="text-body font-medium text-[var(--color-ink)]" data-testid="notification-subject">
                    {n.subject}
                  </p>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">{formatTimestamp(n.sentAt ?? n.createdAt)}</p>
                </div>
                <p className="text-body-sm shrink-0 text-[var(--color-ink-quiet)]" data-testid="notification-status" data-status={n.status}>
                  {STATUS_LABEL[n.status]}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
