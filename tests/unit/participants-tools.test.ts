import { describe, expect, it } from "vitest";
import { participantEmails, participantsCsv, participantsDraft, participantsMailto, PARTICIPANTS_CSV_HEADERS } from "@/modules/attendance/participants-tools";

/* CR-2026-10-03-2045 option B — the trainer's tools for the people who paid (pure helpers). */

const sheet = {
  offering: { programmeTitle: "Data Blueprint & AI/Vibe Coding" } as never,
  rows: [
    { displayName: "Pat Present", user: { id: "1", name: "Pat", email: "Pat@Example.com" }, dateOfBirth: "1991-03-04", country: "Malaysia", attended: true },
    { displayName: "=cmd|' /C calc'!A0", user: { id: "2", name: "x", email: "abe@example.com" }, dateOfBirth: null, country: null, attended: false },
    { displayName: 'Quote "Q", Comma', user: { id: "3", name: "y", email: "pat@example.com" }, dateOfBirth: null, country: "Pakistan", attended: null },
  ] as never,
};

describe("participants tools", () => {
  it("the CSV has the headers, one record per person, the Attended word, and guards formulas and quotes", () => {
    const lines = participantsCsv(sheet, "12–16 Jan 2027").split("\r\n").filter(Boolean);
    expect(lines[0]).toBe(PARTICIPANTS_CSV_HEADERS.join(","));
    expect(lines).toHaveLength(4);
    expect(lines[1]).toBe("Data Blueprint & AI/Vibe Coding,12–16 Jan 2027,Pat Present,Pat@Example.com,1991-03-04,Malaysia,Yes");
    expect(lines[2]!).toContain("'=cmd|"); // a leading = is defused
    expect(lines[2]!.endsWith(",No")).toBe(true);
    expect(lines[3]!).toContain('"Quote ""Q"", Comma"');
    expect(lines[3]!.endsWith(",")).toBe(true); // not yet recorded → empty
  });

  it("the address list is lower-cased and de-duplicated, order kept", () => {
    expect(participantEmails(sheet)).toBe("pat@example.com, abe@example.com");
  });

  it("the BCC link puts everyone in BCC with a draft that invents no policy, and is dropped when too long", () => {
    const draft = participantsDraft("Data Blueprint", "12–16 Jan 2027", "Sam Trainer");
    expect(draft.subject).toBe("Data Blueprint — 12–16 Jan 2027");
    expect(draft.body).toContain("Sam Trainer");
    const href = participantsMailto(sheet, draft)!;
    expect(href.startsWith("mailto:?bcc=")).toBe(true);
    expect(decodeURIComponent(href)).toContain("pat@example.com,abe@example.com");
    const many = { rows: Array.from({ length: 200 }, (_, i) => ({ user: { email: `person${i}@example.com` } })) as never };
    expect(participantsMailto(many, draft)).toBeNull();
    expect(participantsMailto({ rows: [] }, draft)).toBeNull();
  });
});
