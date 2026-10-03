import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import type { DeliveryFormatRecord } from "@/modules/catalogue/programmes/types";

/*
 * The compact training tile for /programs (CR-2026-10-03-2253; founder, 2026-10-03: "reduce the content on the cards …
 * just keep Training name, subhead and existing buttons, add some graph … small cards, we are going to have 10s of
 * trainings"). Prices, timelines and the audience stay on the training's own page.
 *
 * THE GRAPH is a dot row, one dot per pace format: a filled dot means that format has an open date you can register
 * for, a hollow dot means no date yet (you can register interest). It is data the visitor can use, drawn as inline SVG
 * (no chart library), and says nothing about "levels" — the product has no ladder (DR-01).
 */

type TileCourse = {
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string;
  deliveryFormats: Pick<DeliveryFormatRecord, "id" | "name">[];
};

const DOT = 14;
const GAP = 8;

function FormatDots({ formats, noDate }: { formats: TileCourse["deliveryFormats"]; noDate: ReadonlySet<string> }) {
  if (formats.length === 0) return null;
  const withDate = formats.filter((f) => !noDate.has(f.id)).length;
  const label =
    withDate === 0
      ? `No dates yet for ${formats.length === 1 ? "this format" : `these ${formats.length} formats`} — you can register interest`
      : `${withDate} of ${formats.length} ${formats.length === 1 ? "format has" : "formats have"} an open date`;
  const width = formats.length * DOT + (formats.length - 1) * GAP;
  return (
    <div className="flex items-center gap-3" data-testid="tile-graph" data-open={withDate} data-total={formats.length}>
      <svg width={width} height={DOT} viewBox={`0 0 ${width} ${DOT}`} role="img" aria-label={label} className="shrink-0 text-[var(--color-primary)]">
        {formats.map((f, i) => {
          const open = !noDate.has(f.id);
          return <circle key={f.id} cx={i * (DOT + GAP) + DOT / 2} cy={DOT / 2} r={DOT / 2 - 1.25} fill={open ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />;
        })}
      </svg>
      <p className="text-body-sm text-[var(--color-ink-quiet)]">{label}</p>
    </div>
  );
}

export function TrainingTile({ course, noDate }: { course: TileCourse; noDate: ReadonlySet<string> }) {
  return (
    <Card variant="panel" className="flex h-full flex-col gap-4 p-5" data-testid="training-tile" data-slug={course.slug}>
      <div className="flex flex-col gap-2">
        <h3 className="text-h2">{course.title}</h3>
        <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="tile-subhead">
          {course.subtitle || course.summary}
        </p>
      </div>
      <FormatDots formats={course.deliveryFormats} noDate={noDate} />
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
        <Button href={`/programs/${course.slug}`} data-testid="card-details">
          View Details<span className="sr-only">: {course.title}</span> <span aria-hidden="true">→</span>
        </Button>
        <Button variant="secondary" href={`/schedule?training=${course.slug}`} data-testid="card-register">
          Register<span className="sr-only">: {course.title}</span>
        </Button>
      </div>
    </Card>
  );
}
