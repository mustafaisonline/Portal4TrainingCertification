import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Contact — added 2026-09-02 by founder direction.
 *
 * ⚠ NO CONTACT DETAILS ARE INVENTED. There is no business email address,
 * telephone number, office address, company registration or response-time
 * commitment anywhere on this page, because none of those is established
 * in any approved source. Inventing a single one of them would be the
 * most damaging kind of fabrication on a portal that asks people to trust
 * it with training budgets.
 *
 * The founder's published channels and location ("Reach us directly") were
 * shown here until 2026-09-20, when the founder asked for that section to be
 * removed. A real business email remains an OPEN ITEM — see
 * docs/MOCK_DATA_REGISTER.md. The page now has the three routes and the
 * (inert) enquiry form only.
 *
 * The enquiry form is inert per the established mockup convention: no
 * backend exists (no database, no server actions, no API routes), so it
 * submits nowhere and says so rather than faking a success state.
 */

export const metadata: Metadata = {
  title: "Contact Us — Data & AI Academy",
  description:
    "Talk to us about courses for yourself, capability development for your team, or teaching with the Academy.",
};

const routes = [
  {
    label: "For individuals",
    title: "A course for yourself",
    body: "Tell us where you are and what you need to be able to do. If a course fits, we will say which one — and if none does, we will say that too.",
    cta: "Explore courses",
    href: "/DataBlueprint-AIVibeCoding",
  },
  {
    label: "For organisations",
    title: "Capability for your team",
    body: "Private cohorts, tailored engagements and on-site delivery, in Malaysia or internationally. These start with a conversation about the gap, not a quote.",
    cta: "How we work with teams",
    href: "/contact-us",
  },
  {
    label: "For practitioners",
    title: "Teaching with the Academy",
    body: "We add trainers slowly and only when they meet the standard. If you have built and led this work in real organisations, we would like to hear from you.",
    cta: "See the standard",
    href: "/trainers",
  },
];

export default function ContactPage() {
  return (
    <PublicShell>
      {/* ===== Hero =====
          `.night` removed, 2026-09-06 light-theme propagation — see
          components/HomeHeroLight.tsx's header comment. */}
      {/* 2026-09-07 dark-identity redesign (whole-portal scope): `night hero-band` restores the dark navy hero (see app/globals.css). Any comment above saying `.night` was removed is superseded history, kept deliberately. */}
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
          <p className="text-label mb-4 text-[var(--color-primary)]">
            Contact us
          </p>
          <h1 className="text-display-lg mb-6 max-w-[760px]">
            Tell us what you are trying to build
          </h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            Whether that is your own capability, your team&rsquo;s, or a
            course you want delivered at your location — start here and a
            practitioner will answer, not a sales sequence.
          </p>
        </div>
      </section>

      {/* ===== Three routes ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {routes.map((r) => (
            <Card
              key={r.label}
              variant="panel"
              className="flex h-full flex-col border border-[var(--color-line)]"
            >
              <p className="text-label mb-4 text-[var(--color-primary)]">
                {r.label}
              </p>
              <h2 className="text-h1 mb-3">{r.title}</h2>
              <p className="text-body-sm mb-6 flex-1 text-[var(--color-ink-quiet)]">
                {r.body}
              </p>
              <div>
                <Button variant="secondary" href={r.href}>
                  {r.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ===== Enquiry form + channels ===== */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          {/* "Reach us directly" column (founder's channels + location) REMOVED
              2026-09-20, founder direction. Single column now. */}
          <div className="max-w-[720px]">
            <div>
              <h2 className="text-display mb-4">Send an enquiry</h2>
              <p className="text-body-lg mb-8 max-w-[52ch] text-[var(--color-ink-quiet)]">
                The more specific you are about the capability gap, the more
                useful the reply will be.
              </p>

              <form
                aria-describedby="enquiry-status"
                className="flex flex-col gap-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-label">Your name</span>
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      className="rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] px-3.5 py-2.5 text-body-sm text-[var(--color-ink)] outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-label">Email</span>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      className="rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] px-3.5 py-2.5 text-body-sm text-[var(--color-ink)] outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-label">Organisation (optional)</span>
                  <input
                    type="text"
                    name="organisation"
                    autoComplete="organization"
                    className="rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] px-3.5 py-2.5 text-body-sm text-[var(--color-ink)] outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-label">What do you need?</span>
                  <textarea
                    name="message"
                    rows={5}
                    className="resize-y rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] px-3.5 py-2.5 text-body-sm text-[var(--color-ink)] outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/35"
                  />
                </label>

                {/* Honest about being inert. The alternative — a button that
                    shows a fake "thanks, we'll be in touch" — would be a
                    simulated success state, which is prohibited. */}
                <div className="flex flex-wrap items-center gap-4">
                  <Button href="#">Send enquiry</Button>
                  <p
                    id="enquiry-status"
                    className="text-body-sm text-[var(--color-ink-faint)]"
                  >
                    Not connected yet — this mockup has no backend.
                  </p>
                </div>
              </form>
            </div>

          </div>
        </div>
      </section>
    </PublicShell>
  );
}
