/**
 * Live YouTube Data API v3 client for the "Community" section on
 * `/trainers` — see components/signature/CommunityVideos.tsx.
 *
 * Added 2026-09-07, founder direction, replacing the earlier static
 * snapshot (data/videos.ts, now superseded — see its own header comment)
 * after explicit feedback that new episodes must appear automatically,
 * without anyone updating a file by hand.
 *
 * ⚠ THIS IS THE ONE PLACE IN THIS PROJECT THAT CALLS A THIRD-PARTY API.
 * Everything else in this mockup is static/local (see next.config.ts's own
 * header comment and docs/MOCK_DATA_REGISTER.md). That boundary is crossed
 * here deliberately and with founder approval (chat direction, 2026-09-07)
 * — flagged per this project's "no new external services without
 * approval" rule, not snuck in.
 *
 * The API key ships in the public client bundle — unavoidable for a
 * static-export site with no backend to hide it behind, and the same
 * pattern the founder's own yourpartnertechnologies.com already uses (its
 * `main.min.js` embeds a YouTube API key the same way). The actual
 * security boundary is the key's HTTP-referrer restriction (configured in
 * Google Cloud Console, not in this code) to this project's own domains —
 * see README.md / this file's sibling docs for the exact setup. A missing
 * key fails safe: every function below returns a clear error rather than
 * throwing past the caller or silently returning fabricated data.
 *
 * `PLAYLIST_ID` is the founder's own curated "Let's Talk About Data!"
 * playlist (confirmed 2026-09-07 by calling the API directly: 113 items,
 * titled "Let's Talk About Data!", newest-first, matching
 * yourpartnertechnologies.com/services/ltad.html exactly) — deliberately
 * NOT the channel's auto-generated "all uploads" playlist, which the same
 * check found has 133 items on it, the extra ~20 being Shorts and other
 * non-episode content the founder keeps out of this list on his own site.
 * Using his curated list here keeps this section showing the same
 * "episodes" his own page calls out, not raw upload noise.
 */

const API_BASE = "https://www.googleapis.com/youtube/v3";

export const PLAYLIST_ID = "PLM_Wylnk9Tfs6ypCBmFi5_Sg3WhB8LH-C";

/** Up to 50 per call — the API's own maximum, and cheap (1 quota unit
 *  regardless of size), so batches are fetched large and paged through
 *  client-side rather than re-fetching for every 3-video page. */
const BATCH_SIZE = 50;

export type CommunityVideo = {
  id: string;
  title: string;
  thumbnailUrl: string;
};

export type CommunityVideoBatch = {
  videos: CommunityVideo[];
  /** Pass back in to fetch the next batch; null once exhausted. */
  nextPageToken: string | null;
};

export class YouTubeConfigError extends Error {}
export class YouTubeApiError extends Error {}

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!key) {
    throw new YouTubeConfigError(
      "NEXT_PUBLIC_YOUTUBE_API_KEY is not set — see README.md for how to configure it (.env.local locally, a GitHub Actions secret in production).",
    );
  }
  return key;
}

/**
 * One page of the playlist, newest-first (the playlist's own order — the
 * founder maintains it that way, verified 2026-09-07). Throws
 * `YouTubeConfigError` if no key is configured, `YouTubeApiError` for any
 * failed request (bad key, quota exceeded, network error, etc.) — the
 * caller decides how to show that; this module never fabricates a
 * fallback list to paper over a failure.
 */
export async function fetchCommunityVideos(
  pageToken?: string,
): Promise<CommunityVideoBatch> {
  const key = getApiKey();
  const params = new URLSearchParams({
    part: "snippet",
    playlistId: PLAYLIST_ID,
    maxResults: String(BATCH_SIZE),
    key,
  });
  if (pageToken) params.set("pageToken", pageToken);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/playlistItems?${params.toString()}`);
  } catch {
    throw new YouTubeApiError("Network error contacting the YouTube API.");
  }

  if (!res.ok) {
    let message = `YouTube API request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error?.message) message = body.error.message;
    } catch {
      // Body wasn't JSON — keep the generic message above.
    }
    throw new YouTubeApiError(message);
  }

  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];

  const videos: CommunityVideo[] = items
    // A playlist can contain a deleted/private video — its snippet then
    // has no real thumbnail/title worth showing. Skip those rather than
    // rendering a broken card.
    .filter((item: unknown) => {
      const snippet = (item as { snippet?: { title?: string } })?.snippet;
      return Boolean(snippet?.title) && snippet?.title !== "Deleted video" && snippet?.title !== "Private video";
    })
    .map((item: {
      snippet: {
        resourceId?: { videoId?: string };
        title: string;
        thumbnails?: Record<string, { url: string }>;
      };
    }) => {
      const id = item.snippet.resourceId?.videoId ?? "";
      const thumb =
        item.snippet.thumbnails?.medium?.url ??
        item.snippet.thumbnails?.default?.url ??
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      return { id, title: item.snippet.title, thumbnailUrl: thumb };
    })
    .filter((v: CommunityVideo) => v.id);

  return { videos, nextPageToken: data.nextPageToken ?? null };
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
