"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";

/*
 * The sign-up "verification game" (CR-2026-10-03-1245): tap the matching shapes,
 * or answer a text question instead. The puzzle comes from the server
 * (/api/human-check) — the browser never sees the answer; the register form
 * sends the person's answer with the sign-up request and the server checks it.
 * Every tile is a labelled button ("Orange star") so it works with a screen
 * reader and the keyboard; the text question is always one click away.
 */

type Tile = { shape: "circle" | "square" | "triangle" | "star"; colour: "blue" | "orange" | "green" | "purple"; label: string };
type Challenge = { id: string; kind: "tiles" | "sum"; prompt: string; tiles?: Tile[] };

export type HumanCheckState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "skip" } // the test environment's bypass only
  | { status: "ready"; id: string; answer: string };

const FILL: Record<Tile["colour"], string> = { blue: "#2563eb", orange: "#ea580c", green: "#16a34a", purple: "#7c3aed" };

function ShapeIcon({ shape, colour }: { shape: Tile["shape"]; colour: Tile["colour"] }) {
  const fill = FILL[colour];
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true" focusable="false">
      {shape === "circle" && <circle cx="20" cy="20" r="14" fill={fill} />}
      {shape === "square" && <rect x="7" y="7" width="26" height="26" rx="3" fill={fill} />}
      {shape === "triangle" && <polygon points="20,5 35,33 5,33" fill={fill} />}
      {shape === "star" && <polygon points="20,4 24.7,14.6 36.2,15.8 27.6,23.6 30.1,35 20,29.1 9.9,35 12.4,23.6 3.8,15.8 15.3,14.6" fill={fill} />}
    </svg>
  );
}

export function HumanCheck({ onChange, resetKey }: { onChange: (state: HumanCheckState) => void; resetKey: number }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [sum, setSum] = useState("");
  const [failed, setFailed] = useState(false);

  const load = useCallback(
    async (kind: "tiles" | "sum") => {
      setFailed(false);
      setChallenge(null);
      setSelected([]);
      setSum("");
      onChange({ status: "loading" });
      try {
        const res = await fetch(`/api/human-check${kind === "sum" ? "?kind=sum" : ""}`, { cache: "no-store" });
        const data = (await res.json()) as { required?: boolean; challenge?: Challenge };
        if (!res.ok) throw new Error("rate limited");
        if (data.required === false) return onChange({ status: "skip" });
        setChallenge(data.challenge ?? null);
        onChange({ status: "ready", id: data.challenge!.id, answer: "" });
      } catch {
        setFailed(true);
        onChange({ status: "error" });
      }
    },
    [onChange],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps -- a new puzzle on mount and whenever the parent asks (resetKey)
  useEffect(() => void load("tiles"), [resetKey]);

  function toggle(i: number) {
    const next = selected.includes(i) ? selected.filter((n) => n !== i) : [...selected, i];
    setSelected(next);
    if (challenge) onChange({ status: "ready", id: challenge.id, answer: [...next].sort((a, b) => a - b).join(",") });
  }

  if (failed) {
    return (
      <div role="alert" className="text-body-sm text-[var(--color-danger)]">
        The check could not be loaded.{" "}
        <button type="button" onClick={() => void load("tiles")} className="underline underline-offset-4">
          Try again
        </button>
      </div>
    );
  }
  if (!challenge) return <p className="text-body-sm text-[var(--color-ink-quiet)]" role="status">Loading the check…</p>;

  return (
    <fieldset className="flex flex-col gap-3 rounded-[var(--radius-plate)] border border-[var(--color-line)] p-4" data-testid="human-check">
      <legend className="text-label px-1">Quick check — are you a person?</legend>
      <p className="text-body-sm font-medium text-[var(--color-ink)]" data-testid="human-check-prompt" aria-live="polite">
        {challenge.prompt}
      </p>

      {challenge.kind === "tiles" ? (
        <div className="grid grid-cols-3 gap-2 sm:max-w-[320px]" role="group" aria-label={challenge.prompt}>
          {challenge.tiles!.map((t, i) => {
            const on = selected.includes(i);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={on}
                aria-label={t.label}
                data-testid={`human-tile-${i}`}
                data-shape={t.shape}
                onClick={() => toggle(i)}
                className={`grid h-16 place-items-center rounded-[var(--radius-plate)] border-2 bg-[var(--color-ground-raised)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${on ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/40" : "border-[var(--color-line-strong)]"}`}
              >
                <ShapeIcon shape={t.shape} colour={t.colour} />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label htmlFor="human-sum" className="sr-only">
            Your answer
          </label>
          <input
            id="human-sum"
            inputMode="numeric"
            autoComplete="off"
            maxLength={2}
            value={sum}
            data-testid="human-sum"
            onChange={(e) => {
              setSum(e.target.value);
              onChange({ status: "ready", id: challenge.id, answer: e.target.value.trim() });
            }}
            className="w-24 rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => void load("tiles")} data-testid="human-new">
          New puzzle
        </Button>
        {challenge.kind === "tiles" ? (
          <Button type="button" variant="secondary" onClick={() => void load("sum")} data-testid="human-text-alt">
            Use a text question instead
          </Button>
        ) : (
          <Button type="button" variant="secondary" onClick={() => void load("tiles")} data-testid="human-tiles-alt">
            Use the shapes instead
          </Button>
        )}
      </div>
    </fieldset>
  );
}
