import { getPrisma } from "@/db/prisma";
import { authorise, type CurrentUser } from "@/modules/identity/session";
import type { TrainingScope } from "./admin.repository";

/*
 * Who may work on trainings (M12 WP2/WP3; decisions L1, L3, L7).
 *   platform_admin → every training, may publish (L2)
 *   expert (the Trainer role, platform scope) → the trainings linked to
 *     their Trainer profile (`experts.user_id` → `programme_experts`)
 * Server-side only (imports the session). Pages and actions call this
 * FIRST; the repository then re-checks the scope on every read and write,
 * so a UI mistake can never widen access (ADR-020).
 */

export type TrainingAccess =
  | { ok: true; user: CurrentUser; isAdmin: boolean; expertId: string | null; scope: TrainingScope }
  | { ok: false; reason: "signed-out" | "forbidden" };

export async function trainingAccess(): Promise<TrainingAccess> {
  const admin = await authorise("platform_admin");
  if (admin.ok) {
    const expert = await getPrisma().expert.findFirst({ where: { userId: admin.user.id }, select: { id: true } });
    return { ok: true, user: admin.user, isAdmin: true, expertId: expert?.id ?? null, scope: { kind: "all" } };
  }
  if (admin.reason === "signed-out") return { ok: false, reason: "signed-out" };
  const trainer = await authorise("expert");
  if (!trainer.ok) return { ok: false, reason: "forbidden" };
  const expert = await getPrisma().expert.findFirst({ where: { userId: trainer.user.id }, select: { id: true } });
  // A Trainer role without a Trainer profile owns nothing yet (the grant
  // creates the profile — WP3, L10); refuse rather than show an empty area.
  if (!expert) return { ok: false, reason: "forbidden" };
  return { ok: true, user: trainer.user, isAdmin: false, expertId: expert.id, scope: { kind: "expert", expertId: expert.id } };
}
