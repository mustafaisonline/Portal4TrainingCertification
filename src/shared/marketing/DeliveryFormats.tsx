import { Card } from "@/shared/ui/Card";
import type { DeliveryFormatRecord } from "@/modules/catalogue/programmes/types";

/*
 * "Flexible learning formats" — EXTRACTED 2026-09-26 from the course detail
 * page (app/(public)/programs/[slug]/page.tsx, formerly courses/[slug]),
 * markup and classes unchanged, so the flagship's bespoke landing can show
 * the same section now that it is served at /programs/<slug> in place of the
 * generic detail template (which was the only place the flagship's three
 * formats appeared publicly). Renders nothing when a programme has no
 * formats.
 *
 * `notes` (2026-09-26, founder): the participant numbers per format —
 * `content.paceNotes` — listed under the cards, so a reader sees the
 * minimum group size next to the format it applies to.
 */
export function DeliveryFormats({ formats, notes }: { formats: DeliveryFormatRecord[]; notes?: string[] }) {
  if (formats.length === 0) return null;
  return (
    <section id="formats" className="mx-auto max-w-[1280px] scroll-mt-24 px-6 py-16">
      <p className="text-label mb-3 text-[var(--color-primary)]">
        Choose your pace
      </p>
      <h2 className="text-display mb-4">Flexible learning formats</h2>
      <p className="text-body-lg mb-10 max-w-[680px] text-[var(--color-ink-quiet)]">
        All formats cover the same curriculum, learning outcomes,
        exercises and certification requirements. The only difference is
        the pace of delivery.
      </p>
      <div className="grid gap-6 lg:grid-cols-3">
        {formats.map((format) => (
          <Card key={format.code} variant="panel" className="flex flex-col">
            {format.badge && (
              <p className="text-label mb-3 text-[var(--color-primary)]">
                {format.badge}
              </p>
            )}
            <h3 className="text-h2 mb-4">{format.name}</h3>
            <dl className="mb-5 flex flex-col gap-1.5 border-y border-[var(--color-line)] py-4">
              {[
                ["Duration", format.durationLabel],
                ["Schedule", format.scheduleLabel],
                ["Total time", format.totalTimeLabel],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3">
                  <dt className="text-label w-[80px] shrink-0">{k}</dt>
                  <dd className="text-body-sm text-[var(--color-ink-quiet)]">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-label mb-2">Best for</p>
            <ul className="flex flex-col gap-1.5">
              {format.bestFor.map((b) => (
                <li
                  key={b}
                  className="text-body-sm text-[var(--color-ink-quiet)]"
                >
                  {b}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      {notes && notes.length > 0 && (
        <div className="mt-8 max-w-[760px]">
          <p className="text-label mb-3">Participant numbers</p>
          <ul className="flex flex-col" data-testid="pace-notes">
            {notes.map((note) => (
              <li
                key={note}
                className="border-t border-[var(--color-line)] py-3 text-body-sm text-[var(--color-ink-quiet)]"
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
