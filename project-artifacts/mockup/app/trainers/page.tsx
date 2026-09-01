import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";
import { TrainerCard } from "@/components/TrainerCard";
import { practitioners } from "@/data/practitioners";

/**
 * Trainers index — the discovery surface for the P23 Expert Profile
 * concept (MVP_BUILD_SPEC §6: "who teaches, and what they have actually
 * built — genuine experts only, never fabricated"). Renders however many
 * real practitioners exist in data/practitioners.ts; the layout is
 * dignified at n = 1 and scales by data alone. No placeholder slots,
 * ghost cards or "coming soon" profiles — ever.
 */

export const metadata: Metadata = {
  title: "Trainers — Data & AI Academy",
};

export default function TrainersPage() {
  return (
    <PublicShell>
      <section className="night relative">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
          <p className="text-label mb-4 text-[var(--color-primary)]">
            Trainers
          </p>
          <h1 className="text-display-lg mb-5 max-w-[680px]">
            Learn from practitioners
          </h1>
          <p className="text-body-lg max-w-[620px] text-[var(--color-ink-quiet)]">
            Every programme here is designed and delivered by practitioners
            with real enterprise delivery behind them — people who have
            built, led and operated data and AI capabilities, not just
            taught them.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="flex max-w-[760px] flex-col gap-6">
          {practitioners.map((person) => (
            <TrainerCard key={person.slug} person={person} />
          ))}
        </div>
        <p className="mt-8 max-w-[620px] text-body-sm text-[var(--color-ink-faint)]">
          The Academy is founder-led today. As the practitioner network
          grows, additional trainers will be introduced here — only ever
          real people, never placeholder profiles.
        </p>
      </section>
    </PublicShell>
  );
}
