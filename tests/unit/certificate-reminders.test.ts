import { describe, expect, it } from "vitest";
import { addDays, formatCalendarDate } from "@/modules/certificates/dates";
import {
  dueStage,
  dueStages,
  formatFee,
  formatRunTime,
  isReminderStage,
  REMINDER_STAGE_LABEL,
  REMINDER_STAGES,
  reminderMessage,
  reminderSubject,
  reminderTemplateKey,
  type ReminderStage,
} from "@/modules/certificates/reminders";

/*
 * Renewal reminders — the pure rule (MILESTONE_7_EXECUTION_PLAN.md §2.1,
 * §5 criterion 1): every boundary at 31/30/29, 8/7/6, 1/0/−1/−2, −30/−31
 * days, the revoked exclusion (F4), and that each message names the
 * certificate, the date, the fee and the renewal link.
 */

const TODAY = "2026-09-23";
const at = (daysLeft: number, revokedAt: Date | null = null) => ({ expiresOn: addDays(TODAY, daysLeft), revokedAt });

describe("dueStage (reminders.ts)", () => {
  const cases: Array<[number, ReminderStage | null]> = [
    [31, null],
    [30, "before_30"],
    [29, "before_30"],
    [8, "before_30"],
    [7, "before_7"],
    [6, "before_7"],
    [1, "before_7"],
    [0, "before_7"],
    [-1, "lapsed_1"],
    [-2, "lapsed_1"],
    [-30, "lapsed_1"],
    [-31, null],
    [365, null],
    [-400, null],
  ];
  for (const [days, expected] of cases) {
    it(`${days} day(s) left → ${expected ?? "nothing"}`, () => {
      expect(dueStage(at(days), TODAY)).toBe(expected);
      expect(dueStages(at(days), TODAY)).toEqual(expected ? [expected] : []);
    });
  }

  it("never more than one stage at a time", () => {
    for (let d = -40; d <= 40; d += 1) expect(dueStages(at(d), TODAY).length).toBeLessThanOrEqual(1);
  });

  it("a revoked certificate is never reminded, whatever the date (F4)", () => {
    const revoked = new Date("2026-09-01T00:00:00Z");
    for (const d of [30, 7, 0, -1, -30]) {
      expect(dueStage(at(d, revoked), TODAY)).toBeNull();
      expect(dueStages(at(d, revoked), TODAY)).toEqual([]);
    }
  });

  it("stage vocabulary", () => {
    expect(REMINDER_STAGES).toEqual(["before_30", "before_7", "lapsed_1"]);
    for (const s of REMINDER_STAGES) {
      expect(isReminderStage(s)).toBe(true);
      expect(REMINDER_STAGE_LABEL[s]).toBeTruthy();
      expect(reminderTemplateKey(s)).toBe(`certificate.reminder.${s}`);
    }
    expect(isReminderStage("before_1")).toBe(false);
    expect(isReminderStage(null)).toBe(false);
  });
});

describe("reminder messages", () => {
  const input = {
    to: "holder@example.test",
    name: "Hana Holder",
    certificateId: "DAA-2026-ABCD-EFGH",
    programmeTitle: "Data & AI Foundations",
    expiresOn: "2026-10-23",
    renewalUrl: "http://localhost:3101/account/certificate",
    fee: { amountMinor: 1000, currency: "USD" },
  };

  it("formats the fee with two decimals", () => {
    expect(formatFee(1000, "USD")).toBe("USD 10.00");
    expect(formatFee(1250, "USD")).toBe("USD 12.50");
    expect(formatFee(5, "MYR")).toBe("MYR 0.05");
  });

  for (const stage of REMINDER_STAGES) {
    it(`${stage}: subject and body carry the ID, the date, the fee and the link`, () => {
      const m = reminderMessage({ ...input, stage });
      const date = formatCalendarDate(input.expiresOn);
      expect(m.to).toBe(input.to);
      expect(m.templateKey).toBe(`certificate.reminder.${stage}`);
      expect(m.subject).toBe(reminderSubject(stage, input.certificateId, input.expiresOn));
      expect(m.subject).toContain(input.certificateId);
      expect(m.subject).toContain(date);
      expect(m.text).toContain(`Hello ${input.name}`);
      expect(m.text).toContain(`Certificate ID: ${input.certificateId}`);
      expect(m.text).toContain(date);
      expect(m.text).toContain("USD 10.00");
      expect(m.text).toContain(input.renewalUrl);
      expect(m.text).toContain(input.programmeTitle);
      expect(m.text).not.toContain("earned credential"); // never claims to be one, never needs the disclaimer wording either
    });
  }

  it("says 'expired' only after expiry, and still offers renewal", () => {
    expect(reminderSubject("before_30", "X", "2026-10-23")).toMatch(/expires on/);
    expect(reminderSubject("before_7", "X", "2026-10-23")).toMatch(/One week left/);
    expect(reminderSubject("lapsed_1", "X", "2026-10-23")).toMatch(/expired on/);
    expect(reminderMessage({ ...input, stage: "lapsed_1" }).text).toContain("Expired on: 23 Oct 2026");
    expect(reminderMessage({ ...input, stage: "lapsed_1" }).text).toContain("you can still renew");
    expect(reminderMessage({ ...input, stage: "before_7" }).text).toContain("Active until: 23 Oct 2026");
  });

  it("without a fee row the sentence degrades honestly", () => {
    const m = reminderMessage({ ...input, stage: "before_30", fee: null });
    expect(m.text).not.toContain("USD");
    expect(m.text).toContain("Renewal extends the certificate by 12 months.");
  });
});

describe("formatRunTime", () => {
  it("prints the instant in Malaysia time with the zone named", () => {
    // ICU prints "Sep" or "Sept" for en-GB depending on the version; the
    // day, year, time and zone are what matter (16:05Z is 00:05 the next day).
    expect(formatRunTime(new Date("2026-09-22T16:05:00Z"))).toMatch(/^23 Sep\w* 2026, 00:05 MYT$/);
    expect(formatRunTime(new Date("2026-09-22T15:55:00Z"))).toMatch(/^22 Sep\w* 2026, 23:55 MYT$/);
  });
});
