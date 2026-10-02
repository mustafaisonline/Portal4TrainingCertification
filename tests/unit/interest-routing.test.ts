import { describe, expect, it } from "vitest";
import { interestDestination, interestSignInHref } from "@/modules/commerce/interest-routing";

// CR-2026-10-02-2010: where every "Register your interest" button goes.
describe("interestDestination", () => {
  const base = { programmeSlug: "learn-vibe-coding", interestEnabled: true, formatsWithoutOpenDate: 1 };

  it("signed out: the sign-in page, returning to the training's formats", () => {
    expect(interestDestination({ ...base, signedIn: false })).toBe("/sign-in?return-to=%2Fprograms%2Flearn-vibe-coding%23formats");
    expect(interestDestination({ ...base, signedIn: false })).toBe(interestSignInHref("learn-vibe-coding"));
  });

  it("signed in: the training's formats (the interest form); never a Stripe link", () => {
    const href = interestDestination({ ...base, signedIn: true });
    expect(href).toBe("/programs/learn-vibe-coding#formats");
    expect(href).not.toMatch(/stripe|checkout/i);
  });

  it("no answer (the caller keeps its fallback) when the feature is off or every format has an open date", () => {
    expect(interestDestination({ ...base, signedIn: true, interestEnabled: false })).toBeNull();
    expect(interestDestination({ ...base, signedIn: false, formatsWithoutOpenDate: 0 })).toBeNull();
  });
});
