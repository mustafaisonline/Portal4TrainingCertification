"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/Button";

/*
 * "Copy verification link" on the holder page (M6 plan §5 "Holder").
 * PORTED 2026-09-22 from the `copy()` handler in project-artifacts/mockup/
 * components/account/CertificateView.tsx. Changed: the URL comes from the
 * server page (an absolute link, or a path made absolute here against the
 * page's origin); when the clipboard is blocked the link is shown in a
 * read-only field so it can be copied by hand — no silent failure.
 */
export function CopyLinkButton({ href }: { href: string }) {
  const [state, setState] = useState<"idle" | "copied" | "fallback">("idle");

  function resolve(): string {
    return /^https?:\/\//.test(href) ? href : new URL(href, window.location.origin).toString();
  }

  async function copy() {
    const url = resolve();
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      window.setTimeout(() => setState((s) => (s === "copied" ? "idle" : s)), 2500);
    } catch {
      setState("fallback");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={copy} data-testid="copy-link">
          Copy verification link
        </Button>
        <span role="status" className="text-body-sm text-[var(--color-success)]" data-testid="copy-link-status">
          {state === "copied" ? "Copied" : ""}
        </span>
      </div>
      {state === "fallback" ? (
        <label className="text-body-sm flex flex-col gap-1 text-[var(--color-ink-quiet)]">
          Copying is blocked in this browser — select and copy the link:
          <input
            type="text"
            readOnly
            value={resolve()}
            onFocus={(e) => e.currentTarget.select()}
            className="text-body-sm w-full rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] px-3 py-2 text-[var(--color-ink)]"
          />
        </label>
      ) : null}
    </div>
  );
}
