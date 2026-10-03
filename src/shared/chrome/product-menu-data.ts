import { listPublishedProgrammes } from "@/modules/catalogue/programmes/repository";
import { getCurrentUser } from "@/modules/identity/session";
import { holdsRole, isOrganisationUser } from "@/modules/identity/roles.repository";
import type { NavItem } from "./site-nav";

/*
 * What the "Product" panel needs from the server (CR-2026-10-04-0110): the first published trainings (the panel shows up to
 * five, then "See all trainings") and the Dashboard links the signed-in person may actually open. Plain, serialisable data —
 * the panel itself is a client component. Read per request by the layouts that render the header; two cheap queries.
 */

export const PRODUCT_MENU_TRAININGS = 5;

export type ProductMenuData = {
  trainings: { slug: string; title: string }[];
  moreTrainings: boolean;
  signedIn: boolean;
  dashboard: NavItem[];
};

export async function buildProductMenu(): Promise<ProductMenuData> {
  const [programmes, user] = await Promise.all([listPublishedProgrammes(), getCurrentUser()]);
  const dashboard: NavItem[] = user
    ? [
        { href: "/account", label: "User Dashboard" },
        { href: "/account/trainings", label: "My Trainings" },
        { href: "/account/downloads", label: "My Agentic AI" },
        { href: "/account/notifications", label: "Notifications" },
        ...(holdsRole(user.roles, "expert") ? [{ href: "/admin", label: "Trainer Dashboard" }] : []),
        ...(isOrganisationUser(user.roles) ? [{ href: "/organisation", label: "Organisation Dashboard" }] : []),
        ...(holdsRole(user.roles, "platform_admin") ? [{ href: "/admin", label: "Admin Dashboard" }] : []),
      ]
    : [
        { href: "/sign-in", label: "Sign in" },
        { href: "/register", label: "Create an account" },
      ];
  return {
    trainings: programmes.slice(0, PRODUCT_MENU_TRAININGS).map((p) => ({ slug: p.slug, title: p.title })),
    moreTrainings: programmes.length > PRODUCT_MENU_TRAININGS,
    signedIn: user !== null,
    dashboard,
  };
}
