/*
 * Import the founder's book *I Am Datapedia!* into Free Learning
 * (Milestone 14 Phase 2; DR-03; founder decisions P3, P7, P8, P18).
 *
 *   npm run learning:import -- "/path/to/I Am Datapedia.docx" [--draft] [--only <slug>]
 *
 * One-off, dev-time (mammoth is a devDependency, P7). Converts the .docx to
 * HTML with mammoth, splits it into one topic per top-level heading
 * (src/modules/free-learning/import.ts), stores each topic and its images
 * through the repository — one transaction per topic, so a failure leaves
 * every other topic intact and a re-run is safe: a topic is matched by slug,
 * its body and images replaced, and an administrator's unpublish decision is
 * kept. Images the browser cannot show (EMF) are dropped and counted.
 * `--draft` imports everything unpublished; the default publishes.
 *
 * The book file itself never enters the repository (Book/ is ignored).
 */
import { existsSync } from "node:fs";
import path from "node:path";
import mammoth from "mammoth";
import { disconnectPrisma, withTransaction } from "../src/db/prisma.ts";
import { replaceTopicFromImport } from "../src/modules/free-learning/book.repository.ts";
import { splitTopics } from "../src/modules/free-learning/import.ts";

const envFile = path.resolve(process.cwd(), ".env.local");
if (!process.env["DATABASE_URL"] && existsSync(envFile)) process.loadEnvFile(envFile);

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const draft = args.includes("--draft");
const onlyIndex = args.indexOf("--only");
const only = onlyIndex >= 0 ? args[onlyIndex + 1] : null;
if (!file || !existsSync(file)) {
  console.error('usage: npm run learning:import -- "/path/to/I Am Datapedia.docx" [--draft] [--only <slug>]');
  process.exit(2);
}

const DISPLAYABLE = new Set(["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"]);

async function main(docx: string) {
  const images: { mime: string; bytes: Uint8Array<ArrayBuffer> }[] = [];
  const started = Date.now();
  const result = await mammoth.convertToHtml(
    { path: docx },
    {
      styleMap: ["p[style-name='Heading 1'] => h1:fresh", "p[style-name='Heading 2'] => h2:fresh", "p[style-name='Heading 3'] => h3:fresh"],
      convertImage: mammoth.images.imgElement(async (image) => {
        const buf = await image.readAsBuffer();
        const bytes = new Uint8Array(buf.byteLength);
        bytes.set(buf);
        images.push({ mime: image.contentType, bytes });
        return { src: `img://${images.length - 1}` };
      }),
    },
  );
  const topics = splitTopics(result.value);
  console.log(`converted in ${((Date.now() - started) / 1000).toFixed(1)}s: ${topics.length} topics, ${images.length} images, ${result.messages.length} converter notes`);

  const importedAt = new Date();
  let created = 0;
  let replaced = 0;
  let storedImages = 0;
  let droppedImages = 0;
  for (const t of topics) {
    if (only && t.slug !== only) continue;
    const topicImages = t.imageRefs
      .map((ref) => ({ ref, ...images[ref]! }))
      .filter((img) => {
        if (DISPLAYABLE.has(img.mime)) return true;
        droppedImages += 1;
        return false;
      })
      .map((img) => ({ ref: img.ref, mime: img.mime, bytes: img.bytes, alt: null }));
    const bodyHtml = t.bodyHtml.replace(/<img[^>]*src="img:\/\/(\d+)"[^>]*>/g, (m, n) => (topicImages.some((i) => i.ref === Number(n)) ? m : ""));
    const r = await withTransaction((tx) =>
      replaceTopicFromImport(
        tx,
        { position: t.position, slug: t.slug, title: t.title, sourceHeading: t.sourceHeading, bodyHtml, bodyText: t.bodyText, wordCount: t.wordCount, images: topicImages, publish: !draft, importedAt },
        (id) => `/free-learning/images/${id}`,
      ),
    );
    if (r.created) created += 1;
    else replaced += 1;
    storedImages += r.images;
    if ((created + replaced) % 25 === 0) console.log(`  … ${created + replaced} topics`);
  }
  console.log(`done: ${created} created, ${replaced} replaced, ${storedImages} images stored, ${droppedImages} undisplayable images dropped${draft ? " (all unpublished — --draft)" : ""}`);
}

main(file)
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectPrisma());
