import Link from "next/link";
import { itemsOfKind } from "@/content/agentic/catalogue";
import { KIND_PLURAL, type AgenticKind } from "@/content/agentic/types";
import { ItemCard } from "./ItemCard";

const BLURB: Record<AgenticKind, string> = {
  agent: "An agent is a specialist Claude Code can hand work to — a reviewer, an analyst, a tester. Each has one job and clear limits.",
  skill: "A skill is a reusable procedure Claude follows when you ask — an impact analysis, a change record, a prompt rebuild.",
};

export function ItemList({ kind }: { kind: AgenticKind }) {
  const items = itemsOfKind(kind);
  const other = kind === "agent" ? { href: "/agentic-ai/skills", label: "Skills" } : { href: "/agentic-ai/agents", label: "Agents" };
  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-12 lg:py-14">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            <Link href="/agentic-ai" className="underline underline-offset-4">
              Agentic AI
            </Link>
          </p>
          <h1 className="text-display-lg mb-3" data-testid="agentic-list-title">
            {KIND_PLURAL[kind]}
          </h1>
          <p className="text-body-lg max-w-[720px] text-[var(--color-ink-quiet)]">{BLURB[kind]}</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1280px] px-6 py-12">
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3" data-testid="agentic-list">
          {items.map((i) => (
            <li key={i.slug} className="min-w-0">
              <ItemCard item={i} />
            </li>
          ))}
        </ul>
        <p className="text-body-sm mt-8 text-[var(--color-ink-quiet)]">
          Also see the{" "}
          <Link href={other.href} className="text-[var(--color-primary)] underline underline-offset-4">
            {other.label}
          </Link>
          .
        </p>
      </section>
    </>
  );
}
