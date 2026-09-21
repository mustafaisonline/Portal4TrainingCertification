import Link from "next/link";
import { requireUser } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * L01 — the signed-in landing, minimal for M2: who you are, from OUR `users`
 * row and `user_roles` — never from the provider's session — plus the state
 * of verification. The programme/registration content arrives with
 * M3–M5 on real data; nothing here is sample data.
 */
export default async function AccountPage() {
  const user = await requireUser("/account");
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Dashboard</p>
        <h1 className="text-display" data-testid="welcome">
          Welcome, {user.name}
        </h1>
      </header>

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

      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        Programme details, registrations and receipts appear here once those parts of the portal are live.
      </p>
    </div>
  );
}
