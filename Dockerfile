# syntax=docker/dockerfile:1
#
# Training & Certification Portal — container image (Milestone 9 §2 item 7;
# default H3). For the "single container on a managed host" option of
# ADR-016 (Fly.io, Railway, a small VPS). Vercel does not use this file.
#
# Status: WRITTEN, NOT BUILT — no container runtime was available on the
# machine that produced it (docker info failed). First build must be verified
# by the operator: docs/operations/DEPLOYMENT_RUNBOOK.md §3.
#
# Layout choice — `next start`, NOT the standalone server:
#   Next.js can emit a self-contained `.next/standalone/server.js` when
#   next.config.ts sets `output: "standalone"` (node_modules/next/dist/docs/
#   01-app/03-api-reference/05-config/01-next-config-js/output.md). That flag
#   was NOT added, because the bundled docs do not state its effect on the
#   Vercel deployment path and the founder has not chosen a host. This image
#   therefore ships production node_modules + .next and runs `next start`.
#   It is larger (~ node_modules) but needs no config change. If the founder
#   chooses the container route, switching to standalone is a two-line change
#   (add the flag; replace the runtime stage with: copy .next/standalone,
#   .next/static → .next/standalone/.next/static, public → .next/standalone/
#   public; CMD ["node", "server.js"]).
#
# Migrations are NEVER run by the image (ADR-029): `npm run db:deploy` is a
# deliberate operator step from a machine with the repo checked out.
#
# Build:  docker build -t p4tc-portal .
# Run:    docker run --rm -p 3000:3000 --env-file <production env file> p4tc-portal
#         (APP_BASE_URL etc. are read at runtime; instrumentation.ts refuses to
#         start in production when a required variable is absent.)

# ── 1. deps: every dependency, for the build ──────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── 2. build: prisma client + next build ─────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `prisma generate` needs no database; it writes src/generated/prisma from the
# schema. `next build` needs no database either (all DB reads are dynamic).
# A throwaway DATABASE_URL satisfies prisma.config.ts, which reads the name.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate \
 && npm run build

# ── 3. prod-deps: production dependencies only ───────────────────────────────
FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── 4. runtime: non-root, minimal ─────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# wget (BusyBox) is present in alpine for the HEALTHCHECK.
RUN addgroup -S portal && adduser -S -G portal portal
COPY --from=prod-deps --chown=portal:portal /app/node_modules ./node_modules
COPY --from=build --chown=portal:portal /app/package.json ./package.json
COPY --from=build --chown=portal:portal /app/next.config.ts ./next.config.ts
COPY --from=build --chown=portal:portal /app/.next ./.next
COPY --from=build --chown=portal:portal /app/public ./public
# The generated Prisma client (query compiler WASM lives beside it) — the
# server bundle references it by path.
COPY --from=build --chown=portal:portal /app/src/generated ./src/generated
USER portal
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
# package.json's `start` pins -p 3100 for local use; the container listens on
# $PORT (3000) so the platform's default port mapping works unchanged.
CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT}"]
