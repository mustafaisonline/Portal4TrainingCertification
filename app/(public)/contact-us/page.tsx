import type { Metadata } from "next";
import { findPublishedProgrammeBySlug } from "@/modules/catalogue/programmes/repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EnquiryForm } from "./EnquiryForm";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/contact-us/page.tsx (ADR-045)
 * Changed: the inert enquiry form is now the real `EnquiryForm` (server action);
 * the page reads `kind` and `programme` from the query string so other pages
 * can pre-set the enquiry type and the programme it concerns; the
 * "For organisations" route card now links to /for-organisations (the mockup
 * linked back to /contact-us itself, predating that page); the mockup's own
 * <PublicShell> wrapper dropped (app/(public)/layout.tsx provides it);
 * metadata title shortened. Copy otherwise unchanged.
 */

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
 * removed. A real business email remains an OPEN ITEM. The page has the
 * three routes and the enquiry form only.
 */

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Talk to us about courses for yourself, capability development for your team, or teaching with the Academy.",
};

const routes = [
  {
    label: "For individuals",
    title: "A course for yourself",
    body: "Tell us where you are and what you need to be able to do. If a course fits, we will say which one — and if none does, we will say that too.",
    cta: "Explore courses",
    href: "/programs",
  },
  {
    label: "For organisations",
    title: "Capability for your team",
    body: "Private cohorts, tailored engagements and on-site delivery, in Malaysia or internationally. These start with a conversation about the gap, not a quote.",
    cta: "How we work with teams",
    href: "/for-organisations",
  },
  {
    label: "For practitioners",
    title: "Teaching with the Academy",
    body: "We add trainers slowly and only when they meet the standard. If you have built and led this work in real organisations, we would like to hear from you.",
    cta: "See the standard",
    href: "/trainers",
  },
];

type EnquiryKind = "general" | "organisation" | "programme_interest";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const kindRaw = first(params["kind"]);
  const kind: EnquiryKind =
    kindRaw === "organisation" || kindRaw === "programme_interest" ? kindRaw : "general";
  const programmeSlug = first(params["programme"]);
  const programme = programmeSlug ? await findPublishedProgrammeBySlug(programmeSlug) : null;

  const query = new URLSearchParams();
  if (kindRaw) query.set("kind", kindRaw);
  if (programmeSlug) query.set("programme", programmeSlug);
  const sourcePath = query.size ? `/contact-us?${query.toString()}` : "/contact-us";

  return (
    <>
      {/* ===== Hero ===== */}
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

      {/* ===== Enquiry form ===== */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="max-w-[720px]">
            <div>
              <h2 className="text-display mb-4">Send an enquiry</h2>
              <p className="text-body-lg mb-8 max-w-[52ch] text-[var(--color-ink-quiet)]">
                The more specific you are about the capability gap, the more
                useful the reply will be.
              </p>
              {programme ? (
                <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
                  About: <span className="font-medium text-[var(--color-ink)]">{programme.title}</span>
                </p>
              ) : null}

              <EnquiryForm kind={kind} programmeId={programme?.id} sourcePath={sourcePath} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
