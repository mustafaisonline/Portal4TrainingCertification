import type { Metadata } from "next";
import { requireUser } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";

/*
 * S05 — Notification centre.
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/notifications/
 * page.tsx (ADR-045). Changed: server component on the real session; the
 * static sample list of notification types and the WireframeNote are gone.
 * There is no notifications table yet (a later milestone), so the screen is
 * an honest empty state.
 */
export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requireUser("/account/notifications");
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Notifications</p>
        <h1 className="text-display">Your notifications</h1>
      </header>
      <Card variant="panel" className="p-6 sm:p-8">
        <p className="text-body-sm text-[var(--color-ink-quiet)]">No notifications yet.</p>
      </Card>
    </div>
  );
}
