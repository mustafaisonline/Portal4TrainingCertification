/*
 * Node module-resolution hook for the CLI scripts (scripts/*.ts) so that the
 * application's `@/…` import alias (tsconfig `paths`, resolved by Next,
 * Vitest and Playwright) also resolves under plain `node`. Maps `@/x` →
 * `<repo>/src/x`, trying the extensions TypeScript would. Register with:
 *   node --experimental-transform-types --import ./scripts/register-alias.mjs <script>
 * No dependency added (Node ≥ 20.6 `module.register`).
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const EXTENSIONS = ["", ".ts", ".tsx", ".mts", ".js", "/index.ts"];

function withExtension(base) {
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (existsSync(candidate) && !candidate.endsWith(path.sep)) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const found = withExtension(path.join(SRC, specifier.slice(2)));
    if (!found) throw new Error(`alias-loader: cannot resolve ${specifier} under ${SRC}`);
    return nextResolve(pathToFileURL(found).href, context);
  }
  // Extensionless relative imports inside our own source (bundler-style
  // `./legal-documents`) — Node needs the `.ts`.
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    // Dotted module names (`./checkout.service`) look like they carry an
    // extension, so test for the file itself rather than for an extension.
    if (base.startsWith(SRC) && !existsSync(base)) {
      const found = withExtension(base);
      if (found) return nextResolve(pathToFileURL(found).href, context);
    }
  }
  return nextResolve(specifier, context);
}
