/** Standing "this registry is illustrative" statement for the public
 *  verification screens. See data/certificates.ts for why it is mandatory. */
export function SampleBanner() {
  return (
    <p
      role="note"
      className="text-body-sm rounded-[var(--radius-plate)] border border-[var(--color-accent-line)] bg-[var(--color-accent-soft)] px-4 py-3 text-[var(--color-accent-ink)]"
    >
      <strong className="font-semibold">Sample records.</strong> Every
      certificate on this page is invented to show how verification works. No
      one listed has completed a programme.
    </p>
  );
}
