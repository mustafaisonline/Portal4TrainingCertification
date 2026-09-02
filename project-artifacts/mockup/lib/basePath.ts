/*
 * Root-relative asset paths and the GitHub Pages base path.
 *
 * The Pages build serves the site from /Portal4TrainingCertification, not the
 * domain root. `next/link` and `next/font` prepend that base path on their
 * own — but `next/image` with `images.unoptimized` (mandatory for a static
 * export) emits `src` VERBATIM. So a path such as "/experts/foo.jpg" stored
 * in data/ resolves against the domain root and 404s once published.
 *
 * Wrap any root-relative asset handed to <Image> in `assetPath`.
 *
 * NEXT_PUBLIC_BASE_PATH is injected by next.config.ts only when
 * GITHUB_PAGES=true. Locally it is undefined, so this is the identity
 * function and nothing about local behaviour changes.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetPath(path: string): string {
  return path.startsWith("/") ? `${BASE_PATH}${path}` : path;
}
