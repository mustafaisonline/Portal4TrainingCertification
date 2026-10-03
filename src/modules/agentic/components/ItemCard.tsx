import Link from "next/link";
import { KIND_LABEL, type AgenticItem } from "@/content/agentic/types";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

export const itemHref = (i: Pick<AgenticItem, "kind" | "slug">) => `/agentic-ai/${i.kind === "agent" ? "agents" : "skills"}/${i.slug}`;

/** One catalogue card (a list tile): title, one-line summary, the first thing it is best for — the whole card is the link. */
export function ItemCard({ item }: { item: AgenticItem }) {
  return (
    <Card variant="panel" className="relative flex h-full flex-col gap-3 p-5 transition-colors hover:border-[var(--color-primary)]" data-testid="agentic-card" data-slug={item.slug}>
      <div className="flex items-center justify-between gap-2">
        <Chip tone="primary">{KIND_LABEL[item.kind]}</Chip>
      </div>
      <h3 className="text-h2">
        <Link href={itemHref(item)} className="after:absolute after:inset-0" data-testid="agentic-card-link">
          {item.title}
        </Link>
      </h3>
      <p className="text-body-sm text-[var(--color-ink-quiet)]">{item.summary}</p>
      <p className="text-body-sm mt-auto text-[var(--color-ink-faint)]">Best for: {item.bestFor[0]}</p>
    </Card>
  );
}
