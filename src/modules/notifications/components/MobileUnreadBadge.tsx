"use client";

import { useEffect, useState } from "react";

/*
 * The phone version of the bell (CR-2026-10-03-1228): at 320 px the header cannot fit
 * a bell next to the avatar, the theme toggle and the menu button, so the unread
 * count sits on the avatar as a badge. It follows the bell component's count (the bell
 * keeps polling even though it is hidden on phones) through a window event.
 */
export function MobileUnreadBadge({ initialUnread }: { initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  useEffect(() => {
    const on = (e: Event) => setUnread(Number((e as CustomEvent<number>).detail) || 0);
    window.addEventListener("p4tc:unread", on);
    return () => window.removeEventListener("p4tc:unread", on);
  }, []);
  if (unread <= 0) return null;
  return (
    <span data-testid="mobile-unread-badge" className="pointer-events-none absolute -right-1 -top-1 grid min-w-[1.25rem] place-items-center rounded-full bg-[var(--color-action)] px-1 text-[0.7rem] font-semibold leading-5 text-[var(--color-action-ink)] sm:hidden">
      <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span>
      <span className="sr-only">{unread} unread notifications</span>
    </span>
  );
}
