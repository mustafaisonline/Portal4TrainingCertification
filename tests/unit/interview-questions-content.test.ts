import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
 * Content-shape guard for the starting Interview question banks
 * (CR-2026-10-01-1711): every prisma/seed-data/interview-questions/*.json must be
 * valid JSON with a role, a blueprint, and exactly 100 multiple-choice questions
 * — five non-empty options, one correct, unique stems, categories taken from the
 * file's own blueprint, and a model answer of 60–170 words. The seed loads these as
 * DRAFTS and an administrator approves them, but a malformed file must never reach
 * the seed. Skips gracefully when the folder is empty or absent.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(__dirname, "..", "..", "prisma", "seed-data", "interview-questions");
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith(".json")).sort() : [];

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

type Q = { category?: unknown; level?: unknown; stem?: unknown; options?: unknown; correct?: unknown; modelAnswer?: unknown };

describe("interview question files", () => {
  if (files.length === 0) {
    it.skip("no files under prisma/seed-data/interview-questions yet", () => {});
    return;
  }

  for (const file of files) {
    describe(file, () => {
      const raw = readFileSync(path.join(DIR, file), "utf8");
      let data: { role?: { slug?: unknown; name?: unknown; description?: unknown }; blueprint?: { category?: unknown }[]; questions?: Q[] } = {};
      let parsed = true;
      try {
        data = JSON.parse(raw);
      } catch {
        parsed = false;
      }
      const questions = Array.isArray(data.questions) ? data.questions : [];

      it("is valid JSON", () => {
        expect(parsed).toBe(true);
      });

      it("names its role (slug, name, description) and the slug matches the file name", () => {
        expect(typeof data.role?.slug).toBe("string");
        expect(String(data.role?.slug)).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(`${data.role?.slug}.json`).toBe(file);
        expect(String(data.role?.name ?? "").trim().length).toBeGreaterThanOrEqual(2);
        expect(String(data.role?.description ?? "").trim().length).toBeGreaterThan(0);
        expect(String(data.role?.description ?? "").length).toBeLessThanOrEqual(1000);
      });

      it("has exactly 100 questions", () => {
        expect(questions).toHaveLength(100);
      });

      it("every question has five non-empty, distinct options and one valid correct index", () => {
        const bad: string[] = [];
        questions.forEach((q, i) => {
          const options = Array.isArray(q.options) ? q.options : [];
          const texts = options.map((o) => String(o ?? "").trim());
          if (options.length !== 5) bad.push(`#${i + 1}: ${options.length} options`);
          else if (texts.some((t) => t === "")) bad.push(`#${i + 1}: an empty option`);
          else if (new Set(texts.map((t) => t.toLowerCase())).size !== 5) bad.push(`#${i + 1}: duplicate options`);
          if (!Number.isInteger(q.correct) || (q.correct as number) < 0 || (q.correct as number) > 4) bad.push(`#${i + 1}: correct = ${String(q.correct)}`);
        });
        expect(bad).toEqual([]);
      });

      it("every stem is a non-empty string and no two stems are the same", () => {
        const stems = questions.map((q) => String(q.stem ?? "").trim());
        expect(stems.filter((s) => s.length < 10)).toEqual([]);
        const seen = new Map<string, number>();
        const dup: string[] = [];
        stems.forEach((s, i) => {
          const key = s.toLowerCase();
          if (seen.has(key)) dup.push(`#${i + 1} repeats #${seen.get(key)}`);
          else seen.set(key, i + 1);
        });
        expect(dup).toEqual([]);
      });

      it("every category is one of the file's blueprint categories", () => {
        const blueprint = new Set((data.blueprint ?? []).map((b) => String(b.category ?? "")));
        expect(blueprint.size).toBeGreaterThan(0);
        const outside = [...new Set(questions.map((q) => String(q.category ?? "")).filter((c) => !blueprint.has(c)))];
        expect(outside).toEqual([]);
      });

      it("every model answer is 60–170 words", () => {
        const bad = questions.map((q, i) => ({ n: i + 1, w: words(String(q.modelAnswer ?? "")) })).filter((x) => x.w < 60 || x.w > 170);
        expect(bad.map((x) => `#${x.n}: ${x.w} words`)).toEqual([]);
      });
    });
  }
});
