import Link from "next/link";
import { SampleTag } from "@/components/account/SampleTag";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { registrations, withCourse } from "@/data/demoParticipant";

/** L02 — My programmes (wireframe, 2026-09-20). Reframed by DR-02 from
 *  "My Learning" (in progress / not started) to programme PARTICIPATION:
 *  upcoming and completed live programmes. Sample data. */
export default function MyProgrammesPage() {
  const groups = [
    { title: "Upcoming", items: registrations.filter((r) => r.status === "upcoming") },
    { title: "Completed", items: registrations.filter((r) => r.status === "completed") },
  ];
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">My programmes</p>
        <h1 className="text-display">Your programmes</h1>
      </header>
      {groups.map((g) => (
        <section key={g.title} aria-labelledby={`grp-${g.title}`}>
          <h2 id={`grp-${g.title}`} className="text-h1 mb-4">
            {g.title}
          </h2>
          {g.items.length === 0 ? (
            <p className="text-body-sm text-[var(--color-ink-faint)]">Nothing here yet.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {g.items.map((reg) => {
                const { course } = withCourse(reg);
                if (!course) return null;
                return (
                  <li key={reg.id}>
                    <Link href={`/account/programmes/${reg.id}`} className="block">
                      <Card variant="panel" className="p-5 transition-colors hover:border-[var(--color-primary)] sm:p-6">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Chip tone={reg.status === "upcoming" ? "primary" : "neutral"}>
                            {g.title}
                          </Chip>
                          <Chip>{course.level}</Chip>
                          <Chip>{reg.format}</Chip>
                        </div>
                        <p className="text-body-lg font-medium">{course.title}</p>
                        <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">
                          {reg.sessions.map((s) => s.date).join(" · ")}
                          <SampleTag />
                        </p>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        Looking for another programme?{" "}
        <Link
          href="/DataBlueprint-AIVibeCoding"
          className="text-[var(--color-primary)] underline underline-offset-4"
        >
          Explore the programme
        </Link>
        .
      </p>
    </div>
  );
}
