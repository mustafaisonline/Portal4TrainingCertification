import { afterAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "@/db/prisma";
import { createNotification, isSafeLink, latestNotifications, listNotifications, markAllRead, NOTIFICATIONS_PAGE_SIZE, purgeReadBefore, setRead, unreadCount } from "@/modules/notifications/notifications.repository";
import { NOTIFIABLE_TEMPLATES, notifyAdmins, notifyFromEmail } from "@/modules/notifications/notifications.service";
import { createAdminUser, createCertificateUser } from "../helpers/certificates-db";
import { deleteTestUser } from "../helpers/identity-db";

/*
 * In-app notifications against the REAL test database (CR-2026-10-03-1228): every
 * read and write is scoped to one person; an event notifies once; one-time-link
 * emails never become notifications; administrators are told of a new message.
 */

const emails: string[] = [];
async function person() {
  const u = await createCertificateUser({ prefix: "notif" });
  emails.push(u.email);
  return u;
}
afterAll(async () => {
  for (const e of emails) await deleteTestUser(e);
  await disconnectPrisma();
});

const base = { kind: "registration" as const, title: "Registered", body: "Your registration is confirmed.", link: "/account/trainings" };

describe("createNotification", () => {
  it("stores title, body and a same-site link; the same dedupeKey for the same person notifies once", async () => {
    const a = await person();
    expect(await createNotification({ userId: a.id, ...base, dedupeKey: "evt-1" })).toBe(true);
    expect(await createNotification({ userId: a.id, ...base, dedupeKey: "evt-1" })).toBe(false); // an event notifies once
    expect(await createNotification({ userId: a.id, ...base })).toBe(true); // no key → always created
    expect(await unreadCount(a.id)).toBe(2);
    const b = await person();
    expect(await createNotification({ userId: b.id, ...base, dedupeKey: "evt-1" })).toBe(true); // another person, same key: fine
  });

  it("refuses a link that is not a plain same-site path (stored as no link)", async () => {
    const a = await person();
    for (const bad of ["https://evil.example", "//evil.example", "javascript:alert(1)", "/ok\nhttps://evil", "/a b", "evil", ""]) {
      expect(isSafeLink(bad), bad).toBe(false);
      await createNotification({ userId: a.id, ...base, link: bad });
    }
    const rows = await latestNotifications(a.id, 20);
    expect(rows).toHaveLength(7);
    expect(rows.every((r) => r.link === null)).toBe(true);
    expect(isSafeLink("/account/trainings#interests")).toBe(true);
    expect(isSafeLink("/admin/enquiries/abc-123?x=1")).toBe(true);
  });

  it("limits title and body length", async () => {
    const a = await person();
    await createNotification({ userId: a.id, ...base, title: "t".repeat(500), body: "b".repeat(2000) });
    const [n] = await latestNotifications(a.id, 1);
    expect(n!.title).toHaveLength(200);
    expect(n!.body).toHaveLength(500);
  });
});

describe("reading and marking — always scoped to one person", () => {
  it("unread count, latest first, mark read/unread, mark all; ids that are not theirs change nothing", async () => {
    const a = await person();
    const b = await person();
    for (let i = 1; i <= 3; i++) {
      await createNotification({ userId: a.id, ...base, title: `A${i}` });
      await new Promise((r) => setTimeout(r, 15)); // distinct creation times, as real events have
    }
    await createNotification({ userId: b.id, ...base, title: "B1" });
    const mine = await latestNotifications(a.id);
    expect(mine.map((n) => n.title)).toEqual(["A3", "A2", "A1"]);
    const theirs = await latestNotifications(b.id);

    expect(await setRead(a.id, [theirs[0]!.id], true)).toBe(0); // someone else's id: nothing changes
    expect(await unreadCount(b.id)).toBe(1);

    expect(await setRead(a.id, [mine[0]!.id], true)).toBe(1);
    expect(await setRead(a.id, [mine[0]!.id], true)).toBe(0); // already read
    expect(await unreadCount(a.id)).toBe(2);
    expect(await setRead(a.id, [mine[0]!.id], false)).toBe(1);
    expect(await unreadCount(a.id)).toBe(3);

    expect(await markAllRead(a.id)).toBe(3);
    expect(await unreadCount(a.id)).toBe(0);
    expect(await unreadCount(b.id)).toBe(1); // untouched
    expect(await setRead(a.id, ["not-a-uuid", "", "1; DROP TABLE notifications"], true)).toBe(0);
  });

  it("lists with filters (all, unread, by kind) and pages of 20", async () => {
    const a = await person();
    for (let i = 1; i <= 25; i++) {
      await createNotification({ userId: a.id, ...base, kind: i % 5 === 0 ? "certificate" : "registration", title: `n${i}` });
      await new Promise((r) => setTimeout(r, 4));
    }
    const first = await listNotifications(a.id);
    expect(first.total).toBe(25);
    expect(first.items).toHaveLength(NOTIFICATIONS_PAGE_SIZE);
    expect(first.pageCount).toBe(2);
    expect(first.items[0]!.title).toBe("n25");
    expect((await listNotifications(a.id, { page: 2 })).items).toHaveLength(5);
    expect((await listNotifications(a.id, { filter: "certificate" })).total).toBe(5);
    await markAllRead(a.id);
    expect((await listNotifications(a.id, { filter: "unread" })).total).toBe(0);
    expect((await listNotifications(a.id, { page: 99 })).items).toHaveLength(0);
  });

  it("retention removes READ notifications older than the cutoff and keeps unread ones", async () => {
    const a = await person();
    await createNotification({ userId: a.id, ...base, title: "old-read" });
    await createNotification({ userId: a.id, ...base, title: "old-unread" });
    const rows = await latestNotifications(a.id);
    await setRead(a.id, [rows.find((r) => r.title === "old-read")!.id], true);
    await getPrisma().notification.updateMany({ where: { userId: a.id }, data: { createdAt: new Date("2020-01-01") } });
    await purgeReadBefore(new Date("2021-01-01"));
    expect((await latestNotifications(a.id)).map((r) => r.title)).toEqual(["old-unread"]);
  });
});

describe("notifyFromEmail", () => {
  it("creates a notification for the account the email was addressed to (any case), once per outbox row", async () => {
    const a = await person();
    const msg = { to: a.email.toUpperCase(), templateKey: "commerce.registration-confirmed", subject: "Your registration is confirmed: X" };
    expect(await notifyFromEmail(msg, "outbox-1")).toBe(true);
    expect(await notifyFromEmail(msg, "outbox-1")).toBe(false); // the same email never notifies twice
    const [n] = await latestNotifications(a.id);
    expect(n).toMatchObject({ kind: "registration", title: msg.subject, link: "/account/trainings", read: false });
    expect(n!.body).not.toMatch(/https?:\/\//); // a fixed sentence — nothing copied from the email
  });

  it("never turns a one-time-link email into a notification, and skips addresses with no account", async () => {
    const a = await person();
    for (const t of ["identity.verify-email", "identity.reset-password", "enquiry.reply", "enquiry.acknowledgement", "enquiry.notify", "system.test"]) {
      expect(await notifyFromEmail({ to: a.email, templateKey: t, subject: "s" }, `o-${t}`), t).toBe(false);
    }
    expect(await notifyFromEmail({ to: "nobody-here@example.test", templateKey: "commerce.interest-registered", subject: "s" }, "o-x")).toBe(false);
    expect(await unreadCount(a.id)).toBe(0);
  });

  it("the allow-list holds no identity or enquiry template (those carry one-time links or are not the person's event)", () => {
    expect(NOTIFIABLE_TEMPLATES.some((t) => t.startsWith("identity.") || t.startsWith("enquiry."))).toBe(false);
    expect(NOTIFIABLE_TEMPLATES).toContain("commerce.registration-confirmed");
    expect(NOTIFIABLE_TEMPLATES).toContain("certificate.issued");
  });
});

describe("notifyAdmins", () => {
  it("reaches every active platform administrator once, and nobody else", async () => {
    const admin = await createAdminUser("notif-admin");
    emails.push(admin.email);
    const plain = await person();
    const created = await notifyAdmins({ kind: "enquiry", title: "New message", body: "About X.", link: "/admin/enquiries/1", dedupeKey: `enquiry:test-${Date.now()}` });
    expect(created).toBeGreaterThanOrEqual(1);
    expect((await latestNotifications(admin.id)).map((n) => n.title)).toContain("New message");
    expect(await unreadCount(plain.id)).toBe(0);
    const again = await notifyAdmins({ kind: "enquiry", title: "New message", body: "About X.", link: "/admin/enquiries/1", dedupeKey: "enquiry:fixed-key" });
    expect(await notifyAdmins({ kind: "enquiry", title: "New message", body: "About X.", link: "/admin/enquiries/1", dedupeKey: "enquiry:fixed-key" })).toBe(0); // same event: no second notice
    expect(again).toBeGreaterThanOrEqual(1);
  });
});
