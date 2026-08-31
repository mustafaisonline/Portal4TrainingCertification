import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Labelled next-stage placeholder — Mockup Milestone 1's journey ends here
 * by design (approval message, journey diagram). Sign-up (S02) and the
 * learner dashboard (L01) are Mockup Milestone 2+ per §19.
 */
export default function JourneyPlaceholderPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-[640px] px-6 py-24 text-center">
        <Card variant="feature">
          <p className="text-label mb-3">Coming next</p>
          <h1 className="text-display mb-4">
            Sign up &amp; onboarding — coming soon
          </h1>
          <p className="text-body-lg mb-8 text-[var(--color-ink-quiet)]">
            Mockup Milestone 1 ends here by design. The next milestone
            continues the journey: account creation, onboarding, and the
            learner dashboard.
          </p>
          <Button href="/">Back to homepage</Button>
        </Card>
      </div>
    </PublicShell>
  );
}
