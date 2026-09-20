"use client";

import { useEffect } from "react";
import { endDemoSession } from "@/lib/demoSession";

/** Ends the demo session when the signed-out screen is shown, so opening
 *  /sign-out directly behaves like the menu's "Sign out". Idempotent and
 *  renders nothing. (In the real product, sign-out is a server action that
 *  invalidates the session, not a page visit.) */
export function ClearDemoSession() {
  useEffect(() => {
    endDemoSession();
  }, []);
  return null;
}
