import Link from "next/link";
import { notFound } from "next/navigation";
import { findAgenticItem } from "@/content/agentic/catalogue";
import { definitionPath, KIND_LABEL, KIND_PLURAL, type AgenticKind } from "@/content/agentic/types";
import { Chip } from "@/shared/ui/Chip";
import { ItemAccessPanel } from "./ItemAccessPanel";

const list = (items: readonly string[]) => (
  <ul className="text-body-sm flex list-disc flex-col gap-1.5 pl-5 text-[var(--color-ink-quiet)]">
    {items.map((i) => (
      <li key={i}>{i}</li>
    ))}
  </ul>
);

/** An item's own page. Public to read — the full manual is in the download, so the page shows what it does, how, and an example. */
export function ItemDetail({ kind, slug }: { kind: AgenticKind; slug: string }) {
  const item = findAgenticItem(kind, slug);
  if (!item) notFound();
  const base = `/agentic-ai/${kind === "agent" ? "agents" : "skills"}`;
  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-12 lg:py-14">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            <Link href="/agentic-ai" className="underline underline-offset-4">
              Agentic AI
            </Link>{" "}
            /{" "}
            <Link href={base} className="underline underline-offset-4">
              {KIND_PLURAL[kind]}
            </Link>
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h1 className="text-display-lg" data-testid="agentic-title">
              {item.title}
            </h1>
            <Chip tone="primary">{KIND_LABEL[kind]}</Chip>
          </div>
          <p className="text-body-lg max-w-[720px] text-[var(--color-ink-quiet)]">{item.summary}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1280px] gap-10 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-h1 mb-3">Best for</h2>
            {list(item.bestFor)}
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h2 className="text-h2 mb-3">What you give it</h2>
              {list(item.youGive)}
            </div>
            <div>
              <h2 className="text-h2 mb-3">What you get back</h2>
              {list(item.youGet)}
            </div>
          </div>
          <div>
            <h2 className="text-h2 mb-3">How it works</h2>
            <ol className="text-body-sm flex list-decimal flex-col gap-1.5 pl-5 text-[var(--color-ink-quiet)]">
              {item.howItWorks.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] p-5" data-testid="agentic-example">
            <h2 className="text-h2 mb-3">Example</h2>
            <p className="text-body-sm mb-2">
              <strong>You:</strong> {item.example.request}
            </p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              <strong className="text-[var(--color-ink)]">Result:</strong> {item.example.result}
            </p>
          </div>
          <div>
            <h2 className="text-h2 mb-3">Limits — please read</h2>
            {list(item.limits)}
          </div>
        </div>
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start" aria-label="Get this download">
          <ItemAccessPanel item={item} returnTo={`${base}/${item.slug}`} />
          <div className="rounded-[var(--radius-panel)] border border-[var(--color-line)] p-5" data-testid="agentic-contents">
            <h2 className="text-h2 mb-2">In the download</h2>
            <ul className="text-body-sm flex flex-col gap-1.5 text-[var(--color-ink-quiet)]">
              <li>
                <code>{definitionPath(item)}</code> — the {item.kind}
              </li>
              <li>
                <code>MANUAL.md</code> — the full user manual
              </li>
              <li>
                <code>INSTALL.md</code> — step-by-step install guide
              </li>
              <li>
                <code>LICENSE.txt</code> — what you may do with it
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
