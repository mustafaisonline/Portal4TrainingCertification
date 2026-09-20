/** "Sample" marker for every invented value on the signed-in wireframe
 *  (see data/demoParticipant.ts). Cheap on purpose: it must be easy to put
 *  next to every date, order number and status so none reads as real. */
export function SampleTag() {
  return (
    <span className="text-label ml-2 inline-flex items-center rounded-full border border-dashed border-[var(--color-line-strong)] px-2 py-0.5 align-middle text-[0.6rem] text-[var(--color-ink-faint)]">
      Sample
    </span>
  );
}
