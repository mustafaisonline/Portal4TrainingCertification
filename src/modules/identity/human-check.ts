import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { getPrisma } from "@/db/prisma";

/*
 * The sign-up "verification game" (CR-2026-10-03-1245; founder, 2026-10-03: "when
 * user signup, it should show that verification game i.e. to verify whether user
 * creating new account is a human or not"; free — no paid or external CAPTCHA).
 *
 * HOW IT WORKS
 *  - The server makes a small puzzle ("tap every star" among nine shapes, or the
 *    text alternative "what is seven plus four?"), keeps ONLY a keyed hash of the
 *    right answer in `human_challenges`, and sends the browser the pieces — never
 *    the answer.
 *  - The sign-up request carries the challenge id and the person's answer; the
 *    sign-up hook (identity/auth.ts) checks it BEFORE anything else happens.
 *  - A challenge is used once: it is consumed on the first attempt, right or
 *    wrong (so it cannot be brute-forced), expires after ten minutes and holds no
 *    personal data.
 *
 * HONEST LIMIT: any self-made check is weaker than a commercial CAPTCHA — the
 * tiles are readable by a script that parses the page. It adds friction and
 * stops the cheapest bots; the strong control is the emailed activation link
 * (a bot cannot open a mailbox), plus the sign-up rate limit and the honeypot.
 *
 * ACCESSIBILITY: every tile is a labelled button ("Orange star"), the prompt is
 * plain text, and a text question is always offered as an alternative.
 */

export type ChallengeKind = "tiles" | "sum";
export const SHAPES = ["circle", "square", "triangle", "star"] as const;
export const COLOURS = ["blue", "orange", "green", "purple"] as const;
export type Shape = (typeof SHAPES)[number];
export type Colour = (typeof COLOURS)[number];

export type PublicChallenge = {
  id: string;
  kind: ChallengeKind;
  prompt: string;
  /** Only for `tiles`. The order matters: the answer is the list of positions. */
  tiles?: { shape: Shape; colour: Colour; label: string }[];
};

export const HUMAN_CHECK_TTL_MS = 10 * 60 * 1000;
const TILE_COUNT = 9;
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

type Rng = (max: number) => number;
const defaultRng: Rng = (max) => randomInt(max);

/** Pure: builds a tile puzzle and its correct answer. Exported for tests. */
export function buildTilesChallenge(rng: Rng = defaultRng): { prompt: string; tiles: NonNullable<PublicChallenge["tiles"]>; answer: string } {
  for (;;) {
    const tiles = Array.from({ length: TILE_COUNT }, () => {
      const shape = SHAPES[rng(SHAPES.length)]!;
      const colour = COLOURS[rng(COLOURS.length)]!;
      return { shape, colour, label: `${colour[0]!.toUpperCase()}${colour.slice(1)} ${shape}` };
    });
    const target = SHAPES[rng(SHAPES.length)]!;
    const hits = tiles.flatMap((t, i) => (t.shape === target ? [i] : []));
    if (hits.length < 2 || hits.length > 4) continue; // a fair puzzle: a few matches, never all or none
    return { prompt: `Tap every ${target}.`, tiles, answer: normaliseTilesAnswer(hits) };
  }
}

/** Pure: builds the text alternative ("What is seven plus four?"). */
export function buildSumChallenge(rng: Rng = defaultRng): { prompt: string; answer: string } {
  const a = 2 + rng(8);
  const b = 2 + rng(8);
  return { prompt: `What is ${WORDS[a]} plus ${WORDS[b]}? Type the number.`, answer: String(a + b) };
}

/** "3,0,5,3" → "0,3,5": sorted, unique, in range — or "" when it is not a list of tile positions. */
export function normaliseTilesAnswer(raw: readonly number[] | string): string {
  const list = typeof raw === "string" ? raw.split(",").map((s) => s.trim()) : raw.map(String);
  if (list.length === 0 || list.length > TILE_COUNT) return "";
  const nums = new Set<number>();
  for (const item of list) {
    if (!/^\d{1,2}$/.test(item)) return "";
    const n = Number(item);
    if (n >= TILE_COUNT) return "";
    nums.add(n);
  }
  return [...nums].sort((x, y) => x - y).join(",");
}

function normaliseAnswer(kind: string, raw: string): string {
  if (kind === "tiles") return normaliseTilesAnswer(raw);
  return /^\d{1,2}$/.test(raw.trim()) ? String(Number(raw.trim())) : "";
}

function secret(): string {
  const s = process.env["BETTER_AUTH_SECRET"];
  if (!s) throw new Error("BETTER_AUTH_SECRET is not set — see .env.example.");
  return s;
}

/** Keyed hash of the answer, bound to the challenge id so one answer cannot be replayed on another challenge. */
export function hashAnswer(id: string, answer: string): string {
  return createHmac("sha256", secret()).update(`${id}:${answer}`).digest("hex");
}

/** Creates and stores a challenge; returns only what the browser may see. */
export async function createHumanChallenge(kind: ChallengeKind, now: Date = new Date(), rng: Rng = defaultRng): Promise<PublicChallenge> {
  const id = randomUUID();
  const built = kind === "tiles" ? buildTilesChallenge(rng) : buildSumChallenge(rng);
  const prisma = getPrisma();
  await prisma.humanChallenge.create({ data: { id, kind, answerHash: hashAnswer(id, built.answer), expiresAt: new Date(now.getTime() + HUMAN_CHECK_TTL_MS) } });
  // Housekeeping: a day-old challenge is useless; the index on expires_at keeps this cheap.
  void prisma.humanChallenge.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }).catch(() => undefined);
  return kind === "tiles" ? { id, kind, prompt: built.prompt, tiles: (built as ReturnType<typeof buildTilesChallenge>).tiles } : { id, kind, prompt: built.prompt };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True only for a correct answer to a live, unused challenge. The challenge is
 * CONSUMED by the same atomic statement that reads it, so a second attempt —
 * right or wrong, even in parallel — always fails.
 */
export async function verifyHumanChallenge(id: unknown, answer: unknown, now: Date = new Date()): Promise<boolean> {
  if (typeof id !== "string" || !UUID_RE.test(id) || typeof answer !== "string" || answer.length > 64) return false;
  const rows = await getPrisma().$queryRaw<{ kind: string; answer_hash: string }[]>`
    UPDATE human_challenges SET consumed_at = ${now}
    WHERE id = ${id}::uuid AND consumed_at IS NULL AND expires_at > ${now}
    RETURNING kind, answer_hash`;
  const row = rows[0];
  if (!row) return false;
  const normalised = normaliseAnswer(row.kind, answer);
  if (normalised === "") return false;
  const expected = Buffer.from(row.answer_hash, "hex");
  const given = Buffer.from(hashAnswer(id, normalised), "hex");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/**
 * The browser-test escape hatch: the header `x-test-no-human-check: 1` skips the
 * check — but ONLY in the test environment (`APP_ENV=test`, set by
 * playwright.config.ts alone). In any real environment the header is ignored,
 * so it cannot be used to bypass the check.
 */
export function humanCheckBypassed(headers: { get(name: string): string | null } | null | undefined, env: Record<string, string | undefined> = process.env): boolean {
  return env["APP_ENV"] === "test" && headers?.get("x-test-no-human-check") === "1";
}

/** The sign-up body's human-check fields, checked. Returns null when the person passed. */
export async function signUpHumanCheckProblem(body: Record<string, unknown>, headers: { get(name: string): string | null } | null | undefined): Promise<"HUMAN_CHECK_FAILED" | null> {
  if (humanCheckBypassed(headers)) return null;
  // The honeypot: a field no person can see.
  if (typeof body["hpCompany"] === "string" && body["hpCompany"].trim() !== "") return "HUMAN_CHECK_FAILED";
  return (await verifyHumanChallenge(body["humanChallengeId"], body["humanAnswer"])) ? null : "HUMAN_CHECK_FAILED";
}
