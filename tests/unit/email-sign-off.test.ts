import { describe, expect, it } from "vitest";
import { EMAIL_SIGN_OFF } from "@/modules/notifications/sign-off";
import { resetPasswordMessage, verifyEmailMessage } from "@/modules/identity/emails";

describe("email closing (CR-2026-10-03-1227)", () => {
  it("names DataAI Nexus, invites a reply and prints no address", () => {
    expect(EMAIL_SIGN_OFF).toContain("DataAI Nexus");
    expect(EMAIL_SIGN_OFF.toLowerCase()).not.toContain("not monitored");
    expect(EMAIL_SIGN_OFF).not.toContain("@");
  });

  it("the identity emails use it and no longer use the old academy name", () => {
    for (const m of [verifyEmailMessage({ to: "a@example.com", name: "A", url: "https://x.example/v", expiresInMinutes: 60 }), resetPasswordMessage({ to: "a@example.com", name: "A", url: "https://x.example/r", expiresInMinutes: 60 })]) {
      expect(m.text).toContain(EMAIL_SIGN_OFF);
      expect(m.text).not.toContain("Data & AI Academy");
    }
  });
});
