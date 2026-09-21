import { authorise } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";

/* Admin landing — proves the gate in M2. Operations arrive in M8 on real
   data; nothing from the wireframe's adminSamples.ts is shown. */
export default async function AdminPage() {
  const result = await authorise("platform_admin");
  if (!result.ok) return null; // the layout has already refused
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Admin</p>
        <h1 className="text-display" data-testid="admin-title">
          Operations
        </h1>
      </header>
      <Card variant="panel">
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Signed in as <strong className="text-[var(--color-ink)]">{result.user.email}</strong> with administrator
          access and two-factor authentication on. Offerings, registrations, orders and certificate administration
          are delivered in the operations milestone.
        </p>
      </Card>
    </div>
  );
}
