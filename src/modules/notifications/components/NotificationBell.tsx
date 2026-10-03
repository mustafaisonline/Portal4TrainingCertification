"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { markAllNotificationsRead, markNotificationsRead } from "../notifications.actions";

/*
 * The header bell (CR-2026-10-03-1228): an unread badge (99+ cap), a dropdown of
 * the latest five, "Mark all as read" and "See all notifications". The count is
 * refreshed by polling /api/me/notifications every 60 s and whenever the window
 * regains focus — no websocket service. Accessible: the button's name states the
 * count ("Notifications, 3 unread"), a polite live region announces changes, the
 * panel closes on Escape / outside click and returns focus to the button.
 */

export type BellItem = { id: string; kind: string; title: string; body: string; link: string | null; read: boolean; createdAt: string };

const POLL_MS = 60_000;

function ago(iso: string, now: number = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86_400)} d ago`;
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function NotificationBell({ initialUnread, initialLatest }: { initialUnread: number; initialLatest: BellItem[] }) {
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState(initialLatest);
  const [open, setOpen] = useState(false);
  // The server renders this component with fresh values after an action on the page (mark read / all); adopt them when they
  // CHANGE — compared by a signature, so an unrelated re-render with the same server values never undoes a newer poll.
  const signature = `${initialUnread}|${initialLatest.map((n) => `${n.id}:${n.read ? 1 : 0}`).join(",")}`;
  const lastSignature = useRef(signature);
  useEffect(() => {
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    setUnread(initialUnread);
    setItems(initialLatest);
  }, [signature, initialUnread, initialLatest]);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { unread: number; latest: BellItem[] };
      setUnread(data.unread);
      setItems(data.latest);
    } catch {
      /* offline or signed out: keep what is shown */
    }
  }, []);

  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && void refresh();
    const timer = window.setInterval(tick, POLL_MS);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => wrap.current && !wrap.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function opened(id: string) {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - (items.find((n) => n.id === id)?.read ? 0 : 1)));
    setOpen(false);
    void markNotificationsRead([id]).then(() => refresh());
  }

  async function markAll() {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnread(0);
    // EVERY unread notification, not only the five the bell shows — then the server's count is the truth again.
    await markAllNotificationsRead();
    void refresh();
  }

  // Tell the phone badge (MobileUnreadBadge) the current count — the two share nothing else.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("p4tc:unread", { detail: unread }));
  }, [unread]);

  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications, none unread";
  return (
    // From the `sm` breakpoint up; on a phone the header has no room, so the count shows as a badge on the avatar instead.
    <div ref={wrap} className="relative hidden sm:block" data-testid="notification-bell">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={label}
        data-testid="bell-button"
        className="relative grid h-10 w-10 place-items-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary)]"
      >
        <BellIcon />
        {unread > 0 ? (
          <span aria-hidden="true" data-testid="bell-badge" className="absolute -right-1 -top-1 grid min-w-[1.25rem] place-items-center rounded-full bg-[var(--color-action)] px-1 text-[0.7rem] font-semibold leading-5 text-[var(--color-action-ink)]">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
      <span role="status" aria-live="polite" className="sr-only" data-testid="bell-live">
        {unread > 0 ? `${unread} unread notifications` : ""}
      </span>
      {open ? (
        <div data-testid="bell-panel" className="absolute right-0 top-full z-30 mt-2 max-h-[75vh] w-80 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] p-2 shadow-[0_10px_30px_rgba(16,24,40,0.18)]">
          <div className="flex items-center justify-between px-2 pb-1 pt-1">
            <p className="text-label">Notifications</p>
            {unread > 0 ? (
              <button type="button" onClick={() => void markAll()} data-testid="bell-mark-all" className="text-body-sm text-[var(--color-primary)] underline underline-offset-4">
                Mark all as read
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="text-body-sm px-2 py-4 text-[var(--color-ink-quiet)]" data-testid="bell-empty">
              You have no notifications yet.
            </p>
          ) : (
            <ul className="border-t border-[var(--color-line)] pt-1">
              {items.map((n) => {
                const inner = (
                  <>
                    <span className="flex items-start gap-2">
                      <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-[var(--color-primary)]"}`} />
                      <span className="min-w-0">
                        <span className={`block text-body-sm text-[var(--color-ink)] ${n.read ? "" : "font-semibold"}`}>
                          {n.read ? null : <span className="sr-only">Unread: </span>}
                          {n.title}
                        </span>
                        <span className="block text-body-sm text-[var(--color-ink-quiet)]">{n.body}</span>
                        <span className="block text-body-sm text-[var(--color-ink-faint)]">{ago(n.createdAt)}</span>
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={n.id} data-testid="bell-item" data-read={n.read ? "true" : "false"}>
                    {n.link ? (
                      <Link href={n.link} onClick={() => void opened(n.id)} className="block rounded-[var(--radius-plate)] px-2 py-2 hover:bg-[var(--color-ground-tint)]">
                        {inner}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => void opened(n.id)} className="block w-full rounded-[var(--radius-plate)] px-2 py-2 text-left hover:bg-[var(--color-ground-tint)]">
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-[var(--color-line)] px-2 pt-2">
            <Link href="/account/notifications" onClick={() => setOpen(false)} data-testid="bell-see-all" className="text-body-sm inline-block py-1 font-medium text-[var(--color-primary)] underline underline-offset-4">
              See all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
