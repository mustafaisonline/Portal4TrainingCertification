"use client";

import { Button } from "@/components/ui/Button";
import { useDemoRegistrations } from "@/lib/demoRegistrations";

/** "Register" call-to-action that knows whether the demo participant already
 *  has a registration (2026-09-20). Registered → points at the registration;
 *  otherwise → the checkout. Renders nothing while the demo state resolves. */
export function RegisterButton({
  variant = "primary",
  label = "Register for this programme",
}: {
  variant?: "primary" | "secondary";
  label?: string;
}) {
  const regs = useDemoRegistrations();
  if (regs === null) return null;
  return regs.length > 0 ? (
    <Button variant={variant} href="/account/programmes">
      View my registration
    </Button>
  ) : (
    <Button variant={variant} href="/checkout">
      {label}
    </Button>
  );
}
