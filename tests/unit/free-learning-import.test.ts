import { describe, expect, it } from "vitest";
import { cleanTitle, htmlToText, resolveImageSources, sanitiseHtml, slugify, splitTopics, wordCount } from "@/modules/free-learning/import";

/*
 * The book import's pure rules (Milestone 14 Phase 2): the whole-book HTML
 * splits into one topic per <h1>, front matter is dropped, Word's bookmark
 * anchors and anything executable never reach the stored HTML, titles and
 * slugs are derived predictably, duplicates get suffixes, image
 * placeholders are found and later resolved.
 */

const BOOK =
  "<p>Title page</p><p>Contents</p>" +
  '<h1><a id="_Toc1"></a>What is an Entity?</h1><p>An <strong>entity</strong> is anything that can be identified.</p><p><img src="img://0" /></p><p>Second paragraph.</p>' +
  '<h1>Master &amp;Reference Data</h1><p>Text with a <a href="javascript:alert(1)">bad link</a> and <span onclick="x()">handler</span>.</p><script>evil()</script><p></p>' +
  "<h1>What is an Entity?</h1><p>A repeated heading.</p>";

describe("splitTopics", () => {
  it("one topic per <h1>, in order; front matter before the first heading is dropped", () => {
    const topics = splitTopics(BOOK);
    expect(topics.map((t) => t.position)).toEqual([1, 2, 3]);
    expect(topics.map((t) => t.title)).toEqual(["What is an Entity?", "Master &Reference Data", "What is an Entity?"]);
    expect(topics[0]!.bodyHtml).not.toContain("Title page");
  });

  it("derives slugs, suffixes duplicates, keeps the source heading, counts words and finds image refs", () => {
    const [a, b, c] = splitTopics(BOOK);
    expect(a!.slug).toBe("what-is-an-entity");
    expect(b!.slug).toBe("master-and-reference-data");
    expect(c!.slug).toBe("what-is-an-entity-2");
    expect(a!.sourceHeading).toBe("What is an Entity?");
    expect(a!.imageRefs).toEqual([0]);
    expect(a!.bodyText).toBe("An entity is anything that can be identified. Second paragraph.");
    expect(a!.wordCount).toBe(10);
  });

  it("sanitises: bookmark anchors, scripts, event handlers, javascript: links and empty paragraphs are gone", () => {
    const [a, b] = splitTopics(BOOK);
    expect(a!.bodyHtml).not.toContain("_Toc1");
    expect(b!.bodyHtml).not.toContain("<script");
    expect(b!.bodyHtml).not.toContain("onclick");
    expect(b!.bodyHtml).not.toContain("javascript:");
    expect(b!.bodyHtml).toContain('href="#"');
    expect(b!.bodyHtml).not.toContain("<p></p>");
    expect(b!.bodyHtml).toContain("<strong>".length > 0 ? "bad link" : "");
  });
});

describe("helpers", () => {
  it("slugify: ASCII, hyphens, ampersand as 'and', bounded length, never empty", () => {
    expect(slugify("Key Performance Indicators (KPI)")).toBe("key-performance-indicators-kpi");
    expect(slugify("KPI vs OKR vs MBO")).toBe("kpi-vs-okr-vs-mbo");
    expect(slugify("Données & métadonnées")).toBe("donnees-and-metadonnees");
    expect(slugify("!!!")).toBe("topic");
    expect(slugify("x".repeat(200)).length).toBeLessThanOrEqual(80);
  });

  it("htmlToText decodes entities and collapses whitespace; wordCount ignores punctuation-only tokens", () => {
    expect(htmlToText("<p>A &amp; B</p><p>C</p>")).toBe("A & B C");
    expect(wordCount("one two — three")).toBe(3);
    expect(cleanTitle('<a id="_Toc9"></a>Data <em>vs</em> Metadata')).toBe("Data vs Metadata");
  });

  it("sanitiseHtml leaves ordinary markup alone", () => {
    const html = "<p>Keep <strong>this</strong> and <a href=\"https://example.com\">that</a>.</p><ul><li>one</li></ul>";
    expect(sanitiseHtml(html)).toBe(html);
  });

  it("resolveImageSources swaps placeholders for served URLs and leaves unknown refs untouched", () => {
    const out = resolveImageSources('<img src="img://0" /><img src="img://7" />', new Map([[0, "/free-learning/images/abc"]]));
    expect(out).toBe('<img src="/free-learning/images/abc" /><img src="img://7" />');
  });
});
