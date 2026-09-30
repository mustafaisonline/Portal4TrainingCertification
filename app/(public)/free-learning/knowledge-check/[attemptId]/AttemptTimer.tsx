"use client";

import { useEffect, useRef, useState } from "react";

/*
 * The countdown on a running Free Assessment Check (founder, 2026-09-30: 3 hours).
 * The SERVER is the authority: `remainingMs` is what the server measured when it
 * rendered this page (deadline − now), and the browser only counts down from it
 * with a monotonic clock, so a wrong device clock cannot lengthen or shorten the
 * test. When it reaches zero the form is submitted (`onExpire`); the server then
 * refuses the save and scores the test as it stands. Deliberately small: one
 * timer element, one polite announcement at a few thresholds (never every second).
 */

const ANNOUNCE_AT_MIN = [30, 10, 5, 1];

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function AttemptTimer({ remainingMs, onExpire }: { remainingMs: number; onExpire: () => void }) {
  const [left, setLeft] = useState(remainingMs);
  const [announcement, setAnnouncement] = useState("");
  const expire = useRef(onExpire);
  const fired = useRef(false);
  const announced = useRef(new Set<number>());

  useEffect(() => {
    expire.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const t0 = performance.now();
    const tick = () => {
      const now = Math.max(0, remainingMs - (performance.now() - t0));
      setLeft(now);
      const minutes = Math.ceil(now / 60_000);
      for (const at of ANNOUNCE_AT_MIN) {
        if (now > 0 && minutes <= at && !announced.current.has(at)) {
          announced.current.add(at);
          setAnnouncement(`${at} ${at === 1 ? "minute" : "minutes"} left.`);
        }
      }
      if (now <= 0 && !fired.current) {
        fired.current = true;
        setAnnouncement("Time is up. Submitting your test.");
        expire.current();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [remainingMs]);

  return (
    <div className="sticky top-2 z-10 flex items-center justify-between gap-3 rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] px-4 py-2 shadow-sm" data-testid="attempt-timer-bar">
      <span className="text-label">Time left</span>
      <span role="timer" className="text-mono text-lg font-semibold tabular-nums" data-testid="attempt-timer" data-remaining-ms={Math.round(remainingMs)}>
        {formatRemaining(left)}
      </span>
      <span role="status" className="sr-only" data-testid="attempt-timer-status">
        {announcement}
      </span>
    </div>
  );
}
