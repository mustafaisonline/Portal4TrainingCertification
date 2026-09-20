import type { ReactNode } from "react";
import { SampleTag } from "@/components/account/SampleTag";
import { WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/** Shared scaffolding for admin wireframe screens. */
export function AdminHeader({ eyebrow, title, action, back }: { eyebrow: string; title: string; action?: string; back?: { href: string; label: string } }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <a href={back.href} className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
            ← {back.label}
          </a>
        )}
        <p className="text-label mb-2 text-[var(--color-primary)]">{eyebrow}</p>
        <h1 className="text-display">{title}</h1>
      </div>
      {action && (
        <Button type="button" disabled>
          {action}
        </Button>
      )}
    </header>
  );
}

export function AdminTable({ columns, rows, sampleFirstCol = true }: { columns: string[]; rows: ReactNode[][]; sampleFirstCol?: boolean }) {
  return (
    <Card variant="panel" className="overflow-x-auto p-0">
      <table className="text-body-sm w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-line)] text-left">
            {columns.map((c) => (
              <th key={c} className="text-label px-4 py-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[var(--color-line)] last:border-b-0">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">
                  {cell}
                  {j === 0 && sampleFirstCol && <SampleTag />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function AdminScreen({ eyebrow, title, action, columns, rows, note, children, back }: { eyebrow: string; title: string; action?: string; columns: string[]; rows: ReactNode[][]; note: string; children?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col gap-6">
      <AdminHeader eyebrow={eyebrow} title={title} action={action} back={back} />
      {children}
      <AdminTable columns={columns} rows={rows} />
      <WireframeNote>{note}</WireframeNote>
    </div>
  );
}

export function Disabled({ children }: { children: ReactNode }) {
  return (
    <button type="button" disabled className="text-body-sm text-[var(--color-primary)] underline underline-offset-4 disabled:opacity-50">
      {children}
    </button>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card variant="panel" className="p-5">
      <p className="text-label mb-2">{label}</p>
      {/* Size matches the numbers on /account/programme (prices: text-body-lg,
          semibold). Was `text-h1` (28px) — founder 2026-09-21: numbers "very
          big in all admin pages". Headings/body/labels already matched. */}
      <p className="text-body-lg break-words font-semibold text-[var(--color-primary)]">
        {value}
        <SampleTag />
      </p>
      {sub && <p className="text-body-sm mt-1 text-[var(--color-ink-faint)]">{sub}</p>}
    </Card>
  );
}

export function Kv({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="text-body-sm grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-label mb-1">{k}</dt>
          <dd className="break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
