import { MIN_PRIVATE_ROLE_QUESTIONS } from "@/modules/assessment/constants";
import type { OrganisationRoleView } from "@/modules/assessment/organisations.repository";
import type { PublicRoleView } from "@/modules/assessment/roles.repository";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { listingNote } from "./helpers";
import { AddCatalogueRoleForm, CreateRoleForm, RemoveRoleButton } from "./RoleForms";

/* Roles: what the organisation offers (and whether candidates see each), add from the catalogue, create your own. */
export function RolesTab({ roles, catalogue }: { roles: OrganisationRoleView[]; catalogue: PublicRoleView[] }) {
  const offered = new Set(roles.map((r) => r.id));
  const available = catalogue.filter((r) => !offered.has(r.id));
  return (
    <div className="flex flex-col gap-6">
      <Card variant="plate" className="p-5 sm:p-6">
        <h2 className="text-h2 mb-1">Roles you offer</h2>
        <p className="text-body-sm mb-4 max-w-[62ch] text-[var(--color-ink-quiet)]">
          Candidates see a role once it is listed. A role you create yourself is listed when it has {MIN_PRIVATE_ROLE_QUESTIONS} approved questions.
        </p>
        {roles.length === 0 ? (
          <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="org-roles-empty">
            Your organisation offers no roles yet. Add one below.
          </p>
        ) : (
          <ul className="flex flex-col" data-testid="org-roles">
            {roles.map((r) => {
              const note = listingNote(r);
              return (
                <li key={r.id} className="flex flex-col gap-2 border-b border-[var(--color-line)] py-4 first:pt-0 last:border-b-0 last:pb-0" data-testid="org-role-row" data-listed={note.listed ? "yes" : "no"} data-private={r.isPrivate ? "yes" : "no"}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-h2" data-testid="org-role-name">
                      {r.name}
                    </h3>
                    <Chip tone={note.listed ? "primary" : "neutral"}>{note.listed ? "Listed" : "Not listed"}</Chip>
                    <Chip>{r.isPrivate ? "Your own role" : "Shared role"}</Chip>
                  </div>
                  {r.description ? <p className="text-body-sm max-w-[62ch] text-[var(--color-ink-quiet)]">{r.description}</p> : null}
                  <p className="text-body-sm" data-testid="org-role-note">
                    {note.text}
                  </p>
                  <p className="text-body-sm text-[var(--color-ink-quiet)]">
                    Your approved questions: {r.approvedQuestionCount}
                    {r.isPrivate ? "" : ` · Shared bank: ${r.sharedQuestionCount}`}
                  </p>
                  <RemoveRoleButton roleId={r.id} roleName={r.name} />
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card variant="plate" className="p-5 sm:p-6" data-testid="org-add-catalogue">
          <h2 className="text-h2 mb-1">Add a role from the catalogue</h2>
          <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">Shared roles come with a bank of questions. Yours are added to every test for the role.</p>
          <AddCatalogueRoleForm roles={available.map((r) => ({ id: r.id, name: r.name, reviewedQuestionCount: r.reviewedQuestionCount }))} />
        </Card>
        <Card variant="plate" className="p-5 sm:p-6" data-testid="org-create-role">
          <h2 className="text-h2 mb-1">Create your own role</h2>
          <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">For a position the catalogue does not cover. You write its questions.</p>
          <CreateRoleForm />
        </Card>
      </div>
    </div>
  );
}
