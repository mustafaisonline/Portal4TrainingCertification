import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/modules/identity/auth";

/*
 * Mounts Better Auth at /api/auth/* (docs/integrations/next). This is the
 * only route handler that touches authentication; everything else reads the
 * session through src/modules/identity/session.ts.
 */
export const { GET, POST } = toNextJsHandler(auth);
