import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { auth } from "@/modules/identity/auth";
import { activeRolesForUser, grantRole, holdsRole, revokeRole } from "@/modules/identity/roles.repository";
import { findUserByEmail } from "@/modules/identity/users.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { deleteTestUser, firstLink, STRONG_PASSWORD, uniqueEmail, waitForEmail } from "../helpers/identity-db";

/*
 * Identity & access — integration layer against the REAL test database
 * (MILESTONE_2_EXECUTION_PLAN.md §8). Requests go through Better Auth's HTTP
 * handler (the same code path the browser hits, including the consent gate
 * hook and rate limiting), never through mocks.
 */

const BASE = process.env["APP_BASE_URL"] ?? "http://localhost:3101";
const prisma = getPrisma();
const created: string[] = [];

type Res = { status: number; json: unknown; cookies: string[]; headers: Headers };

async function call(method: "GET" | "POST", path: string, body?: unknown, cookie?: string): Promise<Res> {
  const headers = new Headers({ origin: BASE });
  if (body !== undefined) headers.set("content-type", "application/json");
  if (cookie) headers.set("cookie", cookie);
  const res = await auth.handler(
    new Request(`${BASE}/api/auth${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
    }),
  );
  let json: unknown = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json, cookies: res.headers.getSetCookie(), headers: res.headers };
}

/** Cookie header from Set-Cookie values (drops attributes and expired ones). */
function cookieHeader(setCookies: string[], previous = ""): string {
  const jar = new Map<string, string>();
  for (const pair of previous.split(";").map((s) => s.trim()).filter(Boolean)) {
    const [k, ...v] = pair.split("=");
    if (k) jar.set(k, v.join("="));
  }
  for (const sc of setCookies) {
    const [pair, ...attrs] = sc.split(";");
    const [k, ...v] = (pair ?? "").split("=");
    if (!k) continue;
    const expired = attrs.some((a) => /max-age=0/i.test(a.trim()));
    if (expired || v.join("=") === "") jar.delete(k.trim());
    else jar.set(k.trim(), v.join("="));
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function register(email: string, extra: Record<string, unknown> = {}) {
  created.push(email);
  return call("POST", "/sign-up/email", {
    name: "Test Person",
    email,
    password: STRONG_PASSWORD,
    country: "Malaysia",
    consent: true,
    callbackURL: "/account",
    ...extra,
  });
}

async function verify(email: string): Promise<string> {
  const mail = await waitForEmail(email, "identity.verify-email");
  const url = new URL(firstLink(mail.textBody));
  const res = await call("GET", `${url.pathname.replace("/api/auth", "")}${url.search}`);
  expect([302, 303]).toContain(res.status);
  return cookieHeader(res.cookies);
}

async function signIn(email: string, password = STRONG_PASSWORD) {
  return call("POST", "/sign-in/email", { email, password });
}

beforeAll(() => {
  process.env["LEGAL_DOCUMENT_VERSIONS"] = '{"terms":"test","privacy":"test"}';
});

afterEach(async () => {
  for (const email of created.splice(0)) await deleteTestUser(email);
  await prisma.authRateLimit.deleteMany({});
});

afterAll(async () => {
  await disconnectPrisma();
});

describe("registration (criterion 2)", () => {
  it("creates the provider row AND our identity, role, consents, email and audit rows", async () => {
    const email = uniqueEmail("reg");
    const res = await register(email);
    expect(res.status, JSON.stringify(res.json)).toBe(200);

    const user = await findUserByEmail(email);
    expect(user).not.toBeNull();
    expect(user!.country).toBe("Malaysia");
    expect(user!.emailVerifiedAt).toBeNull();

    const identity = await prisma.authIdentity.findFirst({ where: { userId: user!.id } });
    expect(identity?.provider).toBe("better-auth");
    const authUser = await prisma.authUser.findUnique({ where: { email } });
    expect(identity?.providerSubject).toBe(authUser?.id);

    expect(await activeRolesForUser(user!.id)).toEqual([{ role: "participant", scopeType: "platform", scopeId: null }]);

    const consents = await prisma.consent.findMany({ where: { userId: user!.id } });
    expect(consents.map((c) => `${c.documentKey}@${c.documentVersion}`).sort()).toEqual(["privacy@test", "terms@test"]);

    const mail = await waitForEmail(email, "identity.verify-email");
    expect(mail.status).toBe("sent");
    expect(mail.textBody).toContain("/api/auth/verify-email?token=");

    const audit = await listAuditForEntity(prisma, "user", user!.id);
    expect(audit.map((a) => a.action)).toEqual(["user.registered", "consent.recorded"]);
  });

  it("is refused without consent — and leaves no rows behind", async () => {
    const email = uniqueEmail("noconsent");
    const res = await register(email, { consent: false });
    expect(res.status).toBe(400);
    expect((res.json as { code?: string }).code).toBe("CONSENT_REQUIRED");
    expect(await prisma.authUser.findUnique({ where: { email } })).toBeNull();
    expect(await findUserByEmail(email)).toBeNull();
  });

  it("is closed while no legal document version is published", async () => {
    const email = uniqueEmail("closed");
    const saved = process.env["LEGAL_DOCUMENT_VERSIONS"];
    delete process.env["LEGAL_DOCUMENT_VERSIONS"];
    try {
      const res = await register(email);
      expect(res.status).toBe(403);
      expect((res.json as { code?: string }).code).toBe("REGISTRATION_CLOSED");
      expect(await prisma.authUser.findUnique({ where: { email } })).toBeNull();
    } finally {
      process.env["LEGAL_DOCUMENT_VERSIONS"] = saved;
    }
  });

  it("rolls the provider row back when our mapping transaction fails (no half-registered person)", async () => {
    const email = uniqueEmail("collide");
    // Pre-existing business identity with the same email makes `users.email`
    // collide inside the mapping transaction.
    await prisma.user.create({ data: { email, name: "Already Here" } });
    created.push(email);
    const res = await register(email);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(await prisma.authUser.findUnique({ where: { email } })).toBeNull();
    expect(await prisma.authIdentity.count({ where: { user: { email } } })).toBe(0);
  });

  it("rejects a short password; a duplicate email creates nothing and reveals nothing", async () => {
    const email = uniqueEmail("dup");
    expect((await register(email, { password: "short" })).status).toBe(400);
    expect((await register(email)).status).toBe(200);
    const again = await register(email, { name: "Someone Else", password: "a-different-password-1" });
    // Founder decision 2026-09-21 (option A): a repeat sign-up is a clear
    // error, and the existing credential is never touched.
    expect(again.status).toBe(422);
    expect((again.json as { code?: string }).code).toBe("USER_ALREADY_EXISTS");
    expect((await signIn(email)).status).toBe(200); // original password still works
    expect((await signIn(email, "a-different-password-1")).status).toBe(401);
    expect(await prisma.user.count({ where: { email } })).toBe(1);
    expect(await prisma.authUser.count({ where: { email } })).toBe(1);
    expect((await findUserByEmail(email))?.name).toBe("Test Person");
  });
});

describe("verification, sign-in, sign-out (criteria 3, 4, 6)", () => {
  it("allows sign-in straight after registration (founder direction 2026-09-21: no email provider); the emailed link still verifies", async () => {
    const email = uniqueEmail("verify");
    await register(email);
    const before = await signIn(email);
    expect(before.status).toBe(200);
    expect((await findUserByEmail(email))?.emailVerifiedAt).toBeNull();

    const cookie = await verify(email);
    expect(cookie).toContain("session_token");
    const user = await findUserByEmail(email);
    expect(user?.emailVerifiedAt).not.toBeNull();
    const audit = await listAuditForEntity(prisma, "user", user!.id);
    expect(audit.map((a) => a.action)).toContain("user.email_verified");
  });

  it("wrong password is a neutral 401; the 6th attempt in a minute is 429", async () => {
    const email = uniqueEmail("rate");
    await register(email);
    await verify(email);
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await signIn(email, "definitely-not-the-password")).status);
    expect(statuses.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(statuses[5]).toBe(429);
  });

  it("sign-out deletes the session row; the old cookie no longer resolves a session", async () => {
    const email = uniqueEmail("signout");
    await register(email);
    await verify(email);
    const res = await signIn(email);
    expect(res.status).toBe(200);
    const cookie = cookieHeader(res.cookies);
    const authUser = await prisma.authUser.findUnique({ where: { email } });
    // Two sessions exist: the one the verification link opened, and this one.
    const before = await prisma.authSession.count({ where: { userId: authUser!.id } });
    expect(before).toBeGreaterThan(0);

    const session = await call("GET", "/get-session", undefined, cookie);
    expect((session.json as { user?: { email: string } } | null)?.user?.email).toBe(email);

    const out = await call("POST", "/sign-out", {}, cookie);
    expect(out.status).toBe(200);
    // THIS session's row is gone (server-side revocation), not merely the cookie.
    expect(await prisma.authSession.count({ where: { userId: authUser!.id } })).toBe(before - 1);
    const after = await call("GET", "/get-session", undefined, cookie);
    expect(after.json).toBeNull();
  });
});

describe("password reset (criterion 7)", () => {
  it("resets from the emailed link once, revokes other sessions and writes an audit row", async () => {
    const email = uniqueEmail("reset");
    await register(email);
    await verify(email);
    const live = cookieHeader((await signIn(email)).cookies);

    const req = await call("POST", "/request-password-reset", { email, redirectTo: "/reset-password" });
    expect(req.status).toBe(200);
    const mail = await waitForEmail(email, "identity.reset-password");
    const link = new URL(firstLink(mail.textBody));
    // GET the link: Better Auth redirects to /reset-password?token=…
    const follow = await call("GET", `${link.pathname.replace("/api/auth", "")}${link.search}`);
    expect([302, 303]).toContain(follow.status);
    const token = new URL(follow.headers.get("location")!, BASE).searchParams.get("token");
    expect(token).toBeTruthy();

    const newPassword = "an-entirely-new-passphrase-99";
    const reset = await call("POST", "/reset-password", { newPassword, token });
    expect(reset.status).toBe(200);
    // once only
    expect((await call("POST", "/reset-password", { newPassword, token })).status).toBeGreaterThanOrEqual(400);
    // other sessions revoked
    expect((await call("GET", "/get-session", undefined, live)).json).toBeNull();
    // old password dead, new one works
    expect((await signIn(email)).status).toBe(401);
    expect((await signIn(email, newPassword)).status).toBe(200);

    const user = await findUserByEmail(email);
    const audit = await listAuditForEntity(prisma, "user", user!.id);
    expect(audit.map((a) => a.action)).toContain("password.reset");
  });

  it("a reset request for an unknown address is indistinguishable from a known one", async () => {
    const res = await call("POST", "/request-password-reset", { email: uniqueEmail("ghost"), redirectTo: "/reset-password" });
    expect(res.status).toBe(200);
  });
});

describe("change password (founder request 2026-09-21)", () => {
  it("requires the current password, revokes other sessions and writes an audit row", async () => {
    const email = uniqueEmail("chpw");
    await register(email);
    const here = cookieHeader((await signIn(email)).cookies);
    const elsewhere = cookieHeader((await signIn(email)).cookies);

    const wrong = await call("POST", "/change-password", { currentPassword: "nope-nope-nope", newPassword: "fresh-password-77", revokeOtherSessions: true }, here);
    expect(wrong.status).toBe(400);
    expect((wrong.json as { code?: string }).code).toBe("INVALID_PASSWORD");

    const short = await call("POST", "/change-password", { currentPassword: STRONG_PASSWORD, newPassword: "short", revokeOtherSessions: true }, here);
    expect(short.status).toBe(400);

    const ok = await call("POST", "/change-password", { currentPassword: STRONG_PASSWORD, newPassword: "fresh-password-77", revokeOtherSessions: true }, here);
    expect(ok.status, JSON.stringify(ok.json)).toBe(200);

    expect((await signIn(email)).status).toBe(401);
    expect((await signIn(email, "fresh-password-77")).status).toBe(200);
    expect((await call("GET", "/get-session", undefined, elsewhere)).json).toBeNull();

    const user = (await findUserByEmail(email))!;
    expect((await listAuditForEntity(prisma, "user", user.id)).map((a) => a.action)).toContain("password.changed");
  });
});

describe("roles (ADR-020; criterion 8 data layer)", () => {
  it("grant → holds; revoke → does not; re-grant reactivates the same row; every step audited", async () => {
    const email = uniqueEmail("roles");
    await register(email);
    const user = (await findUserByEmail(email))!;

    expect(holdsRole(await activeRolesForUser(user.id), "platform_admin")).toBe(false);
    expect(await withTransaction((tx) => grantRole(tx, { userId: user.id, role: "platform_admin", grantedByUserId: null }))).toBe(true);
    expect(await withTransaction((tx) => grantRole(tx, { userId: user.id, role: "platform_admin", grantedByUserId: null }))).toBe(false);
    expect(holdsRole(await activeRolesForUser(user.id), "platform_admin")).toBe(true);

    expect(await withTransaction((tx) => revokeRole(tx, { userId: user.id, role: "platform_admin", revokedByUserId: null }))).toBe(true);
    expect(holdsRole(await activeRolesForUser(user.id), "platform_admin")).toBe(false);
    expect(await withTransaction((tx) => grantRole(tx, { userId: user.id, role: "platform_admin", grantedByUserId: null }))).toBe(true);
    expect(await prisma.userRole.count({ where: { userId: user.id, role: "platform_admin" } })).toBe(1);

    const actions = (await listAuditForEntity(prisma, "user", user.id)).map((a) => a.action);
    expect(actions.filter((a) => a === "role.granted")).toHaveLength(2);
    expect(actions.filter((a) => a === "role.revoked")).toHaveLength(1);
  });

  it("a platform-scoped grant satisfies a narrower scope; a narrow grant does not satisfy another", () => {
    const roles = [
      { role: "expert" as const, scopeType: "offering" as const, scopeId: "11111111-1111-4111-8111-111111111111" },
      { role: "org_admin" as const, scopeType: "platform" as const, scopeId: null },
    ];
    expect(holdsRole(roles, "expert", { scopeType: "offering", scopeId: "11111111-1111-4111-8111-111111111111" })).toBe(true);
    expect(holdsRole(roles, "expert", { scopeType: "offering", scopeId: "22222222-2222-4222-8222-222222222222" })).toBe(false);
    expect(holdsRole(roles, "expert")).toBe(false);
    expect(holdsRole(roles, "org_admin", { scopeType: "organisation", scopeId: "33333333-3333-4333-8333-333333333333" })).toBe(true);
  });
});
