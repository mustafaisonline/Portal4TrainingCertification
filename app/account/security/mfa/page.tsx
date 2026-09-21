import type { Metadata } from "next";
import { requireUser } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { MfaManager } from "./MfaManager";

/* Two-factor authentication — enrol (TOTP + backup codes) or disable.
   Mandatory for platform administrators before /admin serves anything
   (M2 plan §6.8). */
export const metadata: Metadata = { title: "Two-factor authentication" };

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  const user = await requireUser("/account/security/mfa");
  const { required } = await searchParams;
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Security</p>
        <h1 className="text-display">Two-factor authentication</h1>
      </header>
      {required === "admin" && (
        <p role="status" className="text-body-sm rounded-[var(--radius-plate)] bg-[var(--color-accent-soft)] px-4 py-3 text-[var(--color-accent-ink)]">
          Administrator access requires two-factor authentication. Set it up below to continue to the admin area.
        </p>
      )}
      <Card variant="panel">
        <MfaManager enabled={user.mfaEnabled} />
      </Card>
    </div>
  );
}
