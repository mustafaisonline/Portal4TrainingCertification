/*
 * Pure helpers for importing the book (Milestone 14 Phase 2). No database,
 * no mammoth: the script (scripts/ingest-datapedia.ts) converts the .docx to
 * one HTML string and hands it here; these functions split it into topics,
 * clean each topic's HTML, derive the plain text, slug and word count.
 * Kept pure so tests/unit/free-learning-import.test.ts can prove them on
 * small inputs, and so the same rules apply to any future re-import.
 */

export type ImportedTopic = {
  position: number;
  title: string;
  sourceHeading: string;
  slug: string;
  /** Sanitised HTML; image placeholders `img://N` are still in place. */
  bodyHtml: string;
  bodyText: string;
  wordCount: number;
  /** The `img://N` indices this topic references, in order of appearance. */
  imageRefs: number[];
};

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " " };

export function decodeEntities(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m] ?? m).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

/** Strip tags and collapse whitespace — the searchable text of a topic. */
export function htmlToText(html: string): string {
  return decodeEntities(html.replace(/<\/(p|h[1-6]|li|tr|div|br)>/gi, " ").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** URL slug: lower-case ASCII letters, digits and hyphens, at most 80 chars. */
export function slugify(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return base || "topic";
}

/** Titles as they appear in the heading text: anchors and tags removed,
 *  entities decoded, whitespace collapsed; a missing space after a word
 *  boundary such as "andReference" is left as the source has it. */
export function cleanTitle(headingHtml: string): string {
  return htmlToText(headingHtml).replace(/\s+/g, " ").trim();
}

/**
 * Remove what must never reach a browser from stored HTML: scripts, styles,
 * iframes/objects, inline event handlers, `javascript:` URLs, and the Word
 * bookmark anchors (`<a id="_Toc…"></a>`) that carry nothing. mammoth emits
 * a small, predictable tag set; this is belt and braces, not a parser.
 */
export function sanitiseHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, "")
    .replace(/<a\s+id="[^"]*"\s*><\/a>/g, "")
    .replace(/\s+on[a-z]+="[^"]*"/gi, "")
    .replace(/\s+on[a-z]+='[^']*'/gi, "")
    .replace(/href="\s*javascript:[^"]*"/gi, 'href="#"')
    .replace(/<p>\s*<\/p>/g, "");
}

/**
 * Split the whole-book HTML on `<h1>` — one topic per top-level heading, in
 * order. Everything before the first heading (title pages, table of
 * contents) is front matter and is dropped. Duplicate slugs get a numeric
 * suffix so every topic has a stable address.
 */
export function splitTopics(html: string): ImportedTopic[] {
  const parts = html.split(/(?=<h1>)/).filter((p) => p.startsWith("<h1>"));
  const seen = new Map<string, number>();
  return parts.map((part, index) => {
    const m = /^<h1>([\s\S]*?)<\/h1>/.exec(part);
    const headingHtml = m?.[1] ?? "";
    const title = cleanTitle(headingHtml) || `Topic ${index + 1}`;
    const rawBody = part.slice(m ? m[0].length : 0);
    const bodyHtml = sanitiseHtml(rawBody).trim();
    const bodyText = htmlToText(bodyHtml);
    let slug = slugify(title);
    const n = seen.get(slug) ?? 0;
    seen.set(slug, n + 1);
    if (n > 0) slug = `${slug}-${n + 1}`;
    const imageRefs = [...bodyHtml.matchAll(/img:\/\/(\d+)/g)].map((x) => Number(x[1]));
    return { position: index + 1, title, sourceHeading: decodeEntities(headingHtml.replace(/<[^>]+>/g, "")).trim(), slug, bodyHtml, bodyText, wordCount: wordCount(bodyText), imageRefs };
  });
}

/** Replace the `img://N` placeholders with the served image URLs. */
export function resolveImageSources(bodyHtml: string, urlByRef: Map<number, string>): string {
  return bodyHtml.replace(/img:\/\/(\d+)/g, (m, n) => urlByRef.get(Number(n)) ?? m);
}
