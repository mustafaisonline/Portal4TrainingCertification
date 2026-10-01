import { MIN_PRIVATE_ROLE_QUESTIONS } from "@/modules/assessment/constants";
import type { OrganisationRoleView } from "@/modules/assessment/organisations.repository";

/* Small pure helpers shared by the Organisation Dashboard's tabs. */

export const TABS = [
  { key: "overview", label: "Overview" },
  { key: "roles", label: "Roles" },
  { key: "questions", label: "Questions" },
  { key: "results", label: "Results" },
] as const;
export type TabKey = (typeof TABS)[number]["key"];

export function tabFrom(value: string | string[] | undefined): TabKey {
  const v = typeof value === "string" ? value : "";
  return TABS.find((t) => t.key === v)?.key ?? "overview";
}

/** `/organisation?tab=…` plus any extra query values (empty ones are left out). */
export function tabHref(tab: TabKey, extra: Record<string, string | number | undefined> = {}): string {
  const q = new URLSearchParams();
  if (tab !== "overview") q.set("tab", tab);
  for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `/organisation?${s}` : "/organisation";
}

/** Is the role shown to candidates, and — in plain words — why or why not. */
export function listingNote(role: OrganisationRoleView): { listed: boolean; text: string } {
  if (role.listed) return { listed: true, text: "Listed: candidates can choose this role on your organisation's page." };
  if (!role.published) return { listed: false, text: "Not listed: this role is not published. Please contact us." };
  if (role.isPrivate) {
    const n = role.approvedQuestionCount;
    return { listed: false, text: `Not listed yet: your own role needs ${MIN_PRIVATE_ROLE_QUESTIONS} approved questions before candidates see it. It has ${n}.` };
  }
  return { listed: false, text: "Not listed yet: a shared role needs at least one approved question, from the shared bank or from you." };
}

/** "12 min 05 s", "45 s". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}
