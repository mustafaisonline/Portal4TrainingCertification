"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { markNotificationsRead } from "../notifications.actions";

/** A notification's title as a link: opening it marks it read (fire and forget) and goes where it points. */
export function NotificationOpenLink({ id, href, read, children }: { id: string; href: string; read: boolean; children: ReactNode }) {
  return (
    <Link href={href} onClick={() => (read ? undefined : void markNotificationsRead([id]))} className="text-[var(--color-primary)] underline underline-offset-4" data-testid="notification-open">
      {children}
    </Link>
  );
}
