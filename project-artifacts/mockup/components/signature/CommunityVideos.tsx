"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchCommunityVideos,
  youtubeWatchUrl,
  YouTubeConfigError,
  type CommunityVideo,
} from "@/lib/youtube";

/**
 * Signature component — Community video row (`/trainers`, "Community"
 * section). Added 2026-09-07, founder direction, replacing "In the room"
 * (an empty photograph slot) with proof the Academy is active on YouTube.
 * REBUILT the same day, later, to fetch LIVE from the YouTube Data API
 * (lib/youtube.ts) instead of a static file — founder direction: "the
 * moment new video comes, it should become the first, so don't preload
 * all the video links." A new episode now needs zero changes to this
 * codebase to appear.
 *
 * One row of 3, paged with a left/right arrow, per founder direction —
 * "just show one row". No wrap-around: arrows disable at the true
 * first/last video rather than looping.
 *
 * Fetching strategy: the API returns up to 50 items per call for 1 quota
 * unit regardless of size, so a batch of 50 is fetched and paged through
 * client-side (≈16 three-video pages) before a second network call is
 * needed — not one API call per arrow click. `nextPageToken` chains
 * further batches only once the loaded ones are exhausted. Going back
 * never re-fetches: everything loaded this session stays in state.
 *
 * The page count shown is provisional ("Page N") until the very last
 * batch has been fetched (no more `nextPageToken`), at which point it
 * becomes an exact "N / total" — deliberately not claiming a total before
 * one is actually known, consistent with this project's general rule
 * against stating a number that isn't real yet.
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

function VideoCardSkeleton() {
  return (
    <div>
      <div
        className="mb-3 animate-pulse rounded-[var(--radius-plate)] bg-[var(--color-ground-raised)]"
        style={{ aspectRatio: "16 / 9" }}
      />
      <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-ground-raised)]" />
    </div>
  );
}

type Status = "loading" | "ready" | "error";

export function CommunityVideos() {
  const [videos, setVideos] = useState<CommunityVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  // Guards React 18 Strict Mode's double-invoke in dev from firing this
  // twice and double-counting quota / racing state updates.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    fetchCommunityVideos()
      .then((batch) => {
        setVideos(batch.videos);
        setNextPageToken(batch.nextPageToken);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMessage(
          err instanceof YouTubeConfigError
            ? "Video configuration is incomplete."
            : "Videos couldn't be loaded right now.",
        );
        setStatus("error");
      });
  }, []);

  const loadedPageCount = Math.ceil(videos.length / PAGE_SIZE);
  const exhausted = status === "ready" && nextPageToken === null;
  const start = page * PAGE_SIZE;
  const visible = videos.slice(start, start + PAGE_SIZE);
  const canPrev = page > 0;
  const canNext = start + PAGE_SIZE < videos.length || Boolean(nextPageToken);

  const handleNext = async () => {
    if (fetchingMore) return;
    const nextStart = (page + 1) * PAGE_SIZE;
    if (nextStart < videos.length) {
      setPage((p) => p + 1);
      return;
    }
    if (!nextPageToken) return;
    setFetchingMore(true);
    try {
      const batch = await fetchCommunityVideos(nextPageToken);
      setVideos((prev) => [...prev, ...batch.videos]);
      setNextPageToken(batch.nextPageToken);
      setPage((p) => p + 1);
    } catch (err) {
      // A follow-up batch failing shouldn't wipe out what's already
      // loaded and working — leave the arrow clickable to retry rather
      // than showing a full-section error over otherwise-good content.
      // Logged, not swallowed, so a real failure is still visible.
      // eslint-disable-next-line no-console
      console.error("[CommunityVideos] batch fetch failed", err);
    } finally {
      setFetchingMore(false);
    }
  };

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));

  if (status === "loading") {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        {errorMessage} Watch every episode directly on{" "}
        <a
          href="https://www.youtube.com/@letstalkaboutdata"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-[var(--color-ink)]"
        >
          YouTube
        </a>
        .
      </p>
    );
  }

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
              {/* eslint-disable-next-line @next/next/no-img-element -- static export (next.config.ts) has no image-optimisation server, and a hotlinked external host needs a remotePatterns entry this project doesn't otherwise carry */}
              <img
                src={video.thumbnailUrl}
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

      {(loadedPageCount > 1 || Boolean(nextPageToken)) && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canPrev}
            aria-label="Previous videos"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <IconChevron direction="left" />
          </button>
          <p className="text-label min-w-[5rem] text-center text-[var(--color-ink-faint)]">
            {exhausted ? `${page + 1} / ${loadedPageCount}` : `Page ${page + 1}`}
          </p>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canNext || fetchingMore}
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
