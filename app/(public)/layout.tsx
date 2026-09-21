import type { ReactNode } from "react";
import { AccountControls } from "@/modules/identity/components/AccountControls";
import { PublicShell } from "@/shared/chrome/PublicShell";

/* Public portal — every page inside the shared chrome (M1b port) with the
   M2 account controls. Pages are server components reading repositories. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <PublicShell accountSlot={<AccountControls />} mobileAccountSlot={<AccountControls variant="mobile" />}>
      {children}
    </PublicShell>
  );
}
