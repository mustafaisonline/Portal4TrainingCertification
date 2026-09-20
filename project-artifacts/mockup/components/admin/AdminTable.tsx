import type { ReactNode } from "react";
import { SampleTag } from "@/components/account/SampleTag";
import { WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/** Shared scaffolding for admin wireframe screens: heading, disabled primary
 *  action, a responsive sample table, and the standing note. */
export function AdminScreen({
  eyebrow,
  title,
  action,
  columns,
  rows,
  note,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  columns: string[];
  rows: ReactNode[][];
  note: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-label mb-2 text-[var(--color-primary)]">{eyebrow}</p>
          <h1 className="text-display">{title}</h1>
        </div>
        {action && (
          <Button type="button" disabled>
            {action}
          </Button>
        )}
      </header>
      {children}
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
                    {j === 0 && <SampleTag />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
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
