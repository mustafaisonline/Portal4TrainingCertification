import type { ReactNode } from "react";
import { AccountControls } from "@/modules/identity/components/AccountControls";
import { PublicShell } from "@/shared/chrome/PublicShell";

/* Account screens (register, sign-in, recovery, sign-out) inside the ordinary
   portal chrome. Public pages the header links to arrive in M3. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <PublicShell accountSlot={<AccountControls />} mobileAccountSlot={<AccountControls variant="mobile" />}>
      {children}
    </PublicShell>
  );
}
