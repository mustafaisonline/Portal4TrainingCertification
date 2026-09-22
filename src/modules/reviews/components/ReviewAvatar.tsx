import { initialsOf } from "@/shared/util/initials";

/*
 * Reviewer avatar — the header menu's avatar treatment (AccountMenu) reused
 * for review cards and the admin table: the photo when a `src` is given,
 * otherwise the person's initials. No hooks, so it renders on the server.
 * `src` is decided by the caller: the public card passes the consent-gated
 * /api/reviews/<id>/photo route only when the reviewer consented.
 */
export function ReviewAvatar({ name, src, size = "md" }: { name: string; src: string | null; size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-8 w-8 text-[0.7rem]" : "h-11 w-11 text-[0.8rem]";
  return (
    <span
      aria-hidden="true"
      className={`grid ${dims} shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-action)] font-semibold text-[var(--color-action-ink)]`}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initialsOf(name)}
    </span>
  );
}
