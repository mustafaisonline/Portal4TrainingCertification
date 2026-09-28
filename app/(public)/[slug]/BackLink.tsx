"use client";

import { useRouter } from "next/navigation";

/*
 * "← Back" on the trainer page (founder, 2026-09-28: reached from
 * /programs "there is no way to go back to previous page"). The page has
 * several entry points — the training cards, the footer, About Us, the
 * HRD Corp section — so this goes to the actual previous page, and to the
 * trainings list when there is no history (a shared or direct link).
 */
export function BackLink() {
  const router = useRouter();
  return (
    <button
      type="button"
      data-testid="trainer-back"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/programs");
      }}
      className="text-body-sm mb-4 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4"
    >
      ← Back
    </button>
  );
}
