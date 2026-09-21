import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/*
 * Vitest — unit and integration layers (ADR-025, ADR-038).
 * Integration tests run against a REAL PostgreSQL (DATABASE_URL_TEST), never a
 * mock — see tests/setup-env.ts, which also refuses to run against the dev
 * database.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    setupFiles: ["tests/setup-env.ts"],
    // Integration tests share one database; run files serially so they never
    // interleave writes. Unit tests are cheap enough that this costs nothing.
    fileParallelism: false,
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@app": path.resolve(__dirname, "app"),
    },
  },
});
