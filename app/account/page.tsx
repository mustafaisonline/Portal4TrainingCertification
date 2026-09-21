import Link from "next/link";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import { latestConfirmedRegistration } from "@/modules/commerce/registrations.service";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange } from "@/shared/util/dates";

/*
 * L01 — Participant Dashboard.
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/page.tsx
 * (ADR-045) — its NOT-REGISTERED state only. Changed: server component on
 * the real session (OUR `users` row); the flagship title and summary come
 * from the programme repository; "Register now" → /checkout became
 * "Register interest" → the contact enquiry, because no offering exists to
 * register for yet; every SampleTag, demo hook and the registered-state
 * branch are gone. Registrations, orders and certificates have no tables yet
 * (later milestones), so those blocks render their honest empty states. The
 * "Your capability" card was not ported (no skills profile exists). The M2
 * "Your account" details card is kept beneath.
 */
export default async function AccountPage() {
  const user = await requireUser("/account");
  const flagship = await findFlagshipProgramme();
  // M4 (2026-09-21): the latest CONFIRMED registration, from `registrations`
  // (written only by the paid webhook); the empty state stays when none.
  const latest = await latestConfirmedRegistration(user.id);
  const interestHref = flagship ? `/contact-us?kind=programme_interest&programme=${flagship.slug}` : "/contact-us";

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Dashboard</p>
        <h1 className="text-display" data-testid="welcome">
          Welcome, {user.name}
        </h1>
      </header>

      {flagship && (
        <Card variant="feature" className="p-5! sm:p-8!">
          <p className="text-label mb-3 text-[var(--color-primary)]">Get started</p>
          <h2 className="text-h1 mb-2" data-testid="flagship-title">
            {flagship.title}
          </h2>
          <p className="text-body-sm mb-6 max-w-[60ch] text-[var(--color-ink-quiet)]">{flagship.summary}</p>
          <div className="flex flex-wrap gap-3">
            <Button href="/DataBlueprint-AIVibeCoding">View the programme</Button>
            <Button variant="secondary" href={interestHref}>
              Register interest
            </Button>
          </div>
        </Card>
      )}

      <section aria-labelledby="dash-regs">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="dash-regs" className="text-h1">
            Your registrations
          </h2>
          <Link
            href="/account/programmes"
            className="text-body-sm inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
          >
            View all
          </Link>
        </div>
        {latest ? (
          <Card variant="panel" className="p-5" data-testid="dash-latest-registration">
            <div className="mb-2 flex flex-wrap gap-2">
              <Chip tone="primary">Confirmed</Chip>
              <Chip>{MODALITY_LABEL[latest.offering.modality]}</Chip>
            </div>
            <p className="text-body-lg font-medium">{latest.offering.programmeTitle}</p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              {latest.offering.format?.name ?? MODALITY_LABEL[latest.offering.modality]} ·{" "}
              {formatDateRange(latest.offering.startsOn, latest.offering.endsOn)}
            </p>
          </Card>
        ) : (
          <p className="text-body-sm text-[var(--color-ink-faint)]">You are not registered for a programme yet.</p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="panel" className="p-5">
          <h2 className="text-h1 mb-3">Latest order</h2>
          <p className="text-body-sm text-[var(--color-ink-faint)]">No orders yet.</p>
          <Link
            href="/account/orders"
            className="text-body-sm -mb-2 mt-1 inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
          >
            Orders &amp; receipts
          </Link>
        </Card>
        <Card variant="panel" className="p-5">
          <h2 className="text-h1 mb-3">Your certificate</h2>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">Issued when you complete the programme.</p>
          <Link
            href="/account/certificate"
            className="text-body-sm -mb-2 mt-1 inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
          >
            About the certificate
          </Link>
        </Card>
      </div>

      <Card variant="panel">
        <h2 className="text-h2 mb-4">Your account</h2>
        <dl className="text-body-sm grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-label mb-1">Email</dt>
            <dd data-testid="account-email">{user.email}</dd>
          </div>
          <div>
            <dt className="text-label mb-1">Email verification</dt>
            <dd data-testid="account-verified">
              {user.emailVerified ? <Chip tone="primary">Verified</Chip> : <Chip>Not verified</Chip>}
            </dd>
          </div>
          <div>
            <dt className="text-label mb-1">Password</dt>
            <dd>
              <Link href="/account/security" className="text-[var(--color-primary)] underline underline-offset-4">
                Change password
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-label mb-1">Roles</dt>
            <dd data-testid="account-roles" className="flex flex-wrap gap-2">
              {user.roles.map((r) => (
                <Chip key={`${r.role}:${r.scopeType}:${r.scopeId ?? ""}`}>{r.role.replace("_", " ")}</Chip>
              ))}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
