import { clientKeyOf as sharedClientKeyOf, fixedWindowOverLimit } from "@/modules/platform/rate-limit";

/*
 * Contact Us abuse limits (CR-2026-10-03-1226): the shared atomic fixed-window
 * limiter (src/modules/platform/rate-limit.ts) under this feature's key prefix.
 * Returns true when the caller is OVER the limit.
 */
export const clientKeyOf = sharedClientKeyOf;

export async function enquiryOverLimit(scope: string, clientKey: string, windowMs: number, max: number, now: number = Date.now()): Promise<boolean> {
  return fixedWindowOverLimit(`enquiry:${scope}:${clientKey}`, windowMs, max, now);
}
