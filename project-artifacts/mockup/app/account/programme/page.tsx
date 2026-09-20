import { RegisterButton } from "@/components/account/RegisterButton";
import { SampleTag } from "@/components/account/SampleTag";
import { WireframeNote } from "@/components/auth/FormParts";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  PROGRAMME_TITLE,
  SAMPLE_TRAINER,
  currencyChoices,
  getDeliveryFormat,
  getFlagship,
  getRegionMeta,
  offerings,
} from "@/data/demoParticipant";

/**
 * The Academy's programme, shown to a signed-in participant — wireframe,
 * 2026-09-20, founder direction: "when the user signs in, we also need to
 * show the user our programme … Show only one programme."
 *
 * ONE programme: the flagship (data/demoParticipant.ts FLAGSHIP_SLUG), the
 * same entry the public /DataBlueprint-AIVibeCoding page shows. Real: title,
 * summary, outcomes, "included" list, curriculum, the three delivery formats
 * and the published price in all three currencies. Invented and tagged
 * "Sample": the start dates. The public page's own CTAs still route to
 * /contact-us (unchanged); only this signed-in screen leads to /checkout.
 *
 * ⚠ The title and curriculum are PLACEHOLDERS pending the founder's real
 * Data Blueprint + Vibe Coding curriculum — same caveat as the public page.
 */
export default function ProgrammePage() {
  const course = getFlagship();
  if (!course) return null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Programme</p>
        <h1 className="text-display">{PROGRAMME_TITLE}</h1>
        <p className="text-body-lg mt-3 max-w-[62ch] text-[var(--color-ink-quiet)]">
          {course.summary}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip>{course.level}</Chip>
          <Chip>{course.duration}</Chip>
          <Chip>Trainer: {SAMPLE_TRAINER}</Chip>
        </div>
      </header>

      {/* Price in every currency — the participant chooses at checkout. */}
      <Card variant="feature" className="p-5! sm:p-8!">
        <h2 className="text-h1 mb-1">Investment</h2>
        <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
          Published launch offers — time-limited. You choose the currency you
          pay in at checkout.
        </p>
        <ul className="grid gap-4 sm:grid-cols-3">
          {currencyChoices.map((c) => {
            const price = course.pricing?.[c.key];
            const meta = getRegionMeta(c.key);
            if (!price) return null;
            return (
              <li
                key={c.key}
                className="rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground)] p-4"
              >
                <p className="text-label mb-2">{c.name}</p>
                <p className="text-body-lg break-words font-semibold text-[var(--color-primary)]">{price.today}</p>
                <p className="text-body-sm mt-1 text-[var(--color-ink-faint)] line-through">
                  {price.original}
                </p>
                <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
                  {meta.discountLabel}: {price.discount}
                </p>
                <p className="text-label mt-2 text-[0.6rem]">{meta.subtitle}</p>
              </li>
            );
          })}
        </ul>
        <div className="mt-6">
          <RegisterButton />
        </div>
      </Card>

      <section aria-labelledby="prog-formats">
        <h2 id="prog-formats" className="text-h1 mb-4">
          Choose how you attend
        </h2>
        <ul className="grid gap-4 lg:grid-cols-3">
          {offerings.map((o) => {
            const f = getDeliveryFormat(o);
            if (!f) return null;
            return (
              <li key={o.id}>
                <Card variant="panel" className="h-full p-5">
                  {f.badge && (
                    <div className="mb-3">
                      <Chip tone="primary">{f.badge}</Chip>
                    </div>
                  )}
                  <p className="text-body-lg font-medium">{f.name}</p>
                  <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">
                    {f.duration} · {f.schedule} · {f.totalTime}
                  </p>
                  <p className="text-body-sm mt-3">
                    Next start: {o.dates}
                    <SampleTag />
                  </p>
                  <p className="text-label mt-4 mb-1.5">Best for</p>
                  <ul className="text-body-sm list-disc pl-5 text-[var(--color-ink-quiet)]">
                    {f.bestFor.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="panel" className="p-6">
          <h2 className="text-h1 mb-4">What you will be able to do</h2>
          <ul className="text-body-sm flex list-disc flex-col gap-2 pl-5 text-[var(--color-ink-quiet)]">
            {course.outcomes?.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </Card>
        <Card variant="panel" className="p-6">
          <h2 className="text-h1 mb-4">Included with your registration</h2>
          <ul className="text-body-sm flex list-disc flex-col gap-2 pl-5 text-[var(--color-ink-quiet)]">
            {course.included?.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
            {course.certificate} on attending. It records attendance; it is
            not the Academy&rsquo;s earned credential.
          </p>
        </Card>
      </div>

      <section aria-labelledby="prog-curriculum">
        <h2 id="prog-curriculum" className="text-h1 mb-4">
          Curriculum · {course.modules.length} modules
        </h2>
        <div className="flex flex-col gap-2">
          {course.modules.map((m, i) => (
            <details
              key={m.title}
              className="rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] px-4 py-3"
            >
              <summary className="text-body-sm cursor-pointer font-medium">
                <span className="text-mono mr-2 text-[var(--color-ink-faint)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {m.title}
              </summary>
              {m.description && (
                <p className="text-body-sm mt-3 text-[var(--color-ink-quiet)]">{m.description}</p>
              )}
              {m.points && (
                <ul className="text-body-sm mt-2 list-disc pl-5 text-[var(--color-ink-quiet)]">
                  {m.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </details>
          ))}
        </div>
      </section>

      <div className="flex flex-col items-start gap-4">
        <RegisterButton />
        <WireframeNote>
          Start dates are sample. Title and curriculum are placeholders until
          the final Data Blueprint + Vibe Coding curriculum is supplied.
        </WireframeNote>
      </div>
    </div>
  );
}
