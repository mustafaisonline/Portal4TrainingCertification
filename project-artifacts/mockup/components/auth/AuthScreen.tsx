import type { ReactNode } from "react";
import { PublicShell } from "@/components/PublicShell";
import { Card } from "@/components/ui/Card";

/**
 * Page frame shared by the account wireframes (/sign-in, /register,
 * /forgot-password, /sign-out) — 2026-09-20. One centred panel on the
 * portal's tinted ground, inside the ordinary `PublicShell` so the header,
 * nav and footer stay exactly as on every other page. Server component;
 * the interactive parts live in ./FormParts.
 */
export function AuthScreen({
  eyebrow,
  title,
  lead,
  children,
  footer,
  width = "max-w-[480px]",
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
  /** Secondary navigation beneath the card — "New here? Create account". */
  footer?: ReactNode;
  width?: string;
}) {
  return (
    <PublicShell>
      <section className="bg-[var(--color-ground-tint)]">
        <div className={`mx-auto ${width} px-4 py-14 sm:px-6 sm:py-20`}>
          <p className="text-label mb-3 text-center text-[var(--color-primary)]">
            {eyebrow}
          </p>
          <h1 className="text-display mb-3 text-center">{title}</h1>
          <p className="text-body-sm mx-auto mb-8 max-w-[44ch] text-center text-[var(--color-ink-quiet)]">
            {lead}
          </p>
          <Card variant="panel" className="p-6 sm:p-8">
            {children}
          </Card>
          {footer ? (
            <div className="text-body-sm mt-6 text-center text-[var(--color-ink-quiet)]">
              {footer}
            </div>
          ) : null}
        </div>
      </section>
    </PublicShell>
  );
}
