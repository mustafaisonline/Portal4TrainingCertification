import type { NextConfig } from "next";

// Mockup artifact — static/local only. No server actions, no API routes,
// no database. See docs/DESIGN_FOUNDATION.md and docs/MOCK_DATA_REGISTER.md.
//
// ── GitHub Pages preview build ──────────────────────────────────────────
// The Pages workflow (.github/workflows/deploy-pages.yml) sets
// GITHUB_PAGES=true. EVERY Pages setting is gated behind it, deliberately,
// so local behaviour is unchanged from before Pages existed:
//
//   • basePath would move `next dev` off http://localhost:3000 to
//     http://localhost:3000/Portal4TrainingCertification
//   • output: "export" would disable `npm run start`
//
// With the variable unset — the local default — this file evaluates to the
// empty config it has always been. Do not un-gate these without reading the
// two consequences above.
const isGitHubPages = process.env.GITHUB_PAGES === "true";

// A GitHub *project* site is served from /<repo>, never the domain root.
// Without this, every stylesheet and script 404s once published.
const basePath = "/Portal4TrainingCertification";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      basePath,
      assetPrefix: basePath,
      // Static export ships no image-optimisation server, and next/image is
      // used by TrainerCard, ImageFrame and /trainers. Without this the
      // export build fails outright.
      images: { unoptimized: true },
      // Emit out/<route>/index.html — the shape static hosts serve most
      // predictably.
      trailingSlash: true,
      // Read by lib/basePath.ts. next/image with `unoptimized` does NOT
      // prepend basePath to `src`, so root-relative assets in data/ must be
      // prefixed by hand. Undefined locally => that helper is a no-op.
      env: { NEXT_PUBLIC_BASE_PATH: basePath },
    }
  : {};

export default nextConfig;
