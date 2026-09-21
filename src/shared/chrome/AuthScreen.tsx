import type { ReactNode } from "react";
import { Card } from "@/shared/ui/Card";

/*
 * Page frame for the account screens (/register, /sign-in, /forgot-password,
 * /reset-password, /verify-email, /sign-out). PORTED 2026-09-21 from
 * project-artifacts/mockup/components/auth/AuthScreen.tsx (ADR-045 PORT list,
 * row 7) — one centred panel on the tinted ground. The mockup wrapped this
 * in PublicShell itself; here the (auth) route group's layout does that, so
 * the frame stays a pure server component.
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
    <section className="bg-[var(--color-ground-tint)]">
      <div className={`mx-auto ${width} px-4 py-14 sm:px-6 sm:py-20`}>
        <p className="text-label mb-3 text-center text-[var(--color-primary)]">{eyebrow}</p>
        <h1 className="text-display mb-3 text-center">{title}</h1>
        <p className="text-body-sm mx-auto mb-8 max-w-[44ch] text-center text-[var(--color-ink-quiet)]">{lead}</p>
        <Card variant="panel" className="p-6 sm:p-8">
          {children}
        </Card>
        {footer ? <div className="text-body-sm mt-6 text-center text-[var(--color-ink-quiet)]">{footer}</div> : null}
      </div>
    </section>
  );
}
