"use client";

import { useState } from "react";
import { communityVideos, youtubeThumbnail, youtubeWatchUrl } from "@/data/videos";

/**
 * Signature component — Community video row (`/trainers`, "Community"
 * section). Added 2026-09-07, founder direction, replacing "In the room"
 * (an empty photograph slot) with proof the Academy is active on YouTube.
 *
 * Real data — see data/videos.ts's own header comment for provenance.
 * Cards are plain `<img>`, not `next/image`: this project's static export
 * (next.config.ts, GitHub Pages) sets `images.unoptimized`, and hotlinking
 * an external host through `next/image` needs a `remotePatterns` entry
 * this project doesn't otherwise carry — a plain tag avoids that config
 * change entirely.
 *
 * One row of 3, paged with a left/right arrow rather than shown all at
 * once, per founder direction — "just show one row". No wrap-around: the
 * arrows disable at the first/last page rather than looping, so a viewer
 * always knows which end they're at. `PAGE_SIZE`/`pageCount` are computed
 * from `communityVideos.length`, so this scales to however many videos
 * data/videos.ts holds — 2026-09-07, later the same day: expanded from 10
 * to 112 videos (was stopping at "only 4 pages", founder feedback), no
 * component change needed beyond that, which is the point of computing it.
 */

const PAGE_SIZE = 3;

function IconChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5 L8 12 L15 19" : "M9 5 L16 12 L9 19"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="22" fill="rgba(20,22,30,0.55)" />
      <path d="M18 14.5 L30 22 L18 29.5 Z" fill="white" />
    </svg>
  );
}

export function CommunityVideos() {
  const pageCount = Math.ceil(communityVideos.length / PAGE_SIZE);
  const [page, setPage] = useState(0);

  const start = page * PAGE_SIZE;
  const visible = communityVideos.slice(start, start + PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = page < pageCount - 1;

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((video) => (
          <a
            key={video.id}
            href={youtubeWatchUrl(video.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div
              className="relative mb-3 overflow-hidden rounded-[var(--radius-plate)] bg-[var(--color-ground-raised)]"
              style={{ aspectRatio: "16 / 9" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- see header comment: avoids a next.config remotePatterns change for a hotlinked external thumbnail */}
              <img
                src={youtubeThumbnail(video.id)}
                alt={video.title}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                <IconPlay />
              </span>
            </div>
            <p className="text-body-sm leading-snug text-[var(--color-ink)] group-hover:underline">
              {video.title}
            </p>
          </a>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!canPrev}
            aria-label="Previous videos"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <IconChevron direction="left" />
          </button>
          <p className="text-label text-[var(--color-ink-faint)]">
            {page + 1} / {pageCount}
          </p>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={!canNext}
            aria-label="More videos"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <IconChevron direction="right" />
          </button>
        </div>
      )}
    </div>
  );
}
