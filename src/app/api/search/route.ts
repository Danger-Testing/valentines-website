import { NextRequest, NextResponse } from "next/server";
import type { SearchResult } from "@/lib/search";

const MAX_RESULTS = 10;

class SearchError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

// --- YouTube: the site's own search endpoint, no API key needed ---

type YouTubeVideo = {
  videoId?: string;
  title?: { runs?: { text?: string }[] };
  ownerText?: { runs?: { text?: string }[] };
  lengthText?: { simpleText?: string };
};

// Video entries sit at varying depths of the response, so walk all of it
function collectVideos(node: unknown, out: YouTubeVideo[]) {
  if (out.length >= MAX_RESULTS || !node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) collectVideos(child, out);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "videoRenderer") out.push(value as YouTubeVideo);
    else collectVideos(value, out);
  }
}

async function searchYouTube(query: string): Promise<SearchResult[]> {
  const response = await fetch(
    "https://www.youtube.com/youtubei/v1/search?prettyPrint=false",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00",
            hl: "en",
          },
        },
        query,
        // Videos only
        params: "EgIQAQ%3D%3D",
      }),
    },
  );
  if (!response.ok) throw new SearchError("YouTube search failed");

  const videos: YouTubeVideo[] = [];
  collectVideos(await response.json(), videos);

  return videos.flatMap((video) => {
    const title = video.title?.runs?.[0]?.text;
    if (!video.videoId || !title) return [];
    return {
      type: "youtube" as const,
      mediaId: video.videoId,
      title,
      subtitle:
        [video.ownerText?.runs?.[0]?.text, video.lengthText?.simpleText]
          .filter(Boolean)
          .join(" · ") || null,
      image: `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
    };
  });
}

// --- Spotify: official Web API with an app token ---

type SpotifyTrack = {
  id: string;
  name: string;
  artists?: { name: string }[];
  album?: { images?: { url: string }[] };
};

let spotifyToken: { value: string; expiresAt: number } | null = null;

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new SearchError("Spotify search isn't set up yet", 501);
  }
  if (spotifyToken && Date.now() < spotifyToken.expiresAt) {
    return spotifyToken.value;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) throw new SearchError("Spotify search failed");

  const { access_token, expires_in } = await response.json();
  spotifyToken = {
    value: access_token,
    // Refresh a minute early
    expiresAt: Date.now() + (expires_in - 60) * 1000,
  };
  return spotifyToken.value;
}

async function searchSpotify(query: string): Promise<SearchResult[]> {
  const token = await getSpotifyToken();
  const response = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=${MAX_RESULTS}&q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new SearchError("Spotify search failed");

  const data = await response.json();
  const tracks: SpotifyTrack[] = data.tracks?.items ?? [];

  return tracks.filter(Boolean).map((track) => ({
    type: "spotify" as const,
    mediaId: `track/${track.id}`,
    title: track.name,
    subtitle: track.artists?.map((artist) => artist.name).join(", ") || null,
    // Images are sorted largest first; the smallest is plenty for a list row
    image: track.album?.images?.at(-1)?.url ?? null,
  }));
}

// --- X / Twitter: official v2 recent search API ---

type XTweet = {
  id: string;
  text: string;
  author_id?: string;
};

type XUser = {
  id: string;
  name?: string;
  username?: string;
  profile_image_url?: string;
};

async function queryX(bearer: string, xQuery: string) {
  const url = new URL("https://api.x.com/2/tweets/search/recent");
  url.searchParams.set("query", xQuery);
  url.searchParams.set("max_results", String(MAX_RESULTS));
  url.searchParams.set("tweet.fields", "author_id,text");
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "name,username,profile_image_url");

  return fetch(url.toString(), {
    headers: { Authorization: `Bearer ${bearer}` },
  });
}

async function searchTwitter(query: string): Promise<SearchResult[]> {
  const rawToken = process.env.X_API_BEARER_TOKEN;
  if (!rawToken) {
    throw new SearchError("X search isn't set up yet", 501);
  }
  const bearer = rawToken.includes("%")
    ? decodeURIComponent(rawToken)
    : rawToken;

  const cleaned = query.replace(/[()]/g, " ").trim();
  let response = await queryX(bearer, `${cleaned} -is:retweet`);
  if (response.status === 400) {
    const quoted = `"${query.replace(/["\\]/g, " ").trim()}" -is:retweet`;
    response = await queryX(bearer, quoted);
  }
  if (!response.ok) throw new SearchError("X search failed");

  const data = await response.json();
  const tweets: XTweet[] = data.data ?? [];
  const users = new Map<string, XUser>(
    (data.includes?.users ?? []).map((user: XUser) => [user.id, user]),
  );

  return tweets.map((tweet) => {
    const author = tweet.author_id ? users.get(tweet.author_id) : undefined;
    const subtitle = author?.username
      ? [author.name, `@${author.username}`].filter(Boolean).join(" · ")
      : (author?.name ?? null);
    return {
      type: "twitter" as const,
      mediaId: tweet.id,
      title: tweet.text,
      subtitle,
      image: author?.profile_image_url ?? null,
    };
  });
}

// --- Letterboxd: its own search sits behind a bot check, so films are found
// through IMDb's suggestions and mapped over with Letterboxd's /imdb/ redirect

type ImdbSuggestion = {
  id?: string;
  l?: string;
  qid?: string;
  s?: string;
  y?: number;
  i?: { imageUrl?: string };
};

const FILM_KINDS = new Set(["movie", "tvMovie", "short", "video", "tvSpecial"]);
const IMDB_ID = /^tt\d+$/;

async function searchLetterboxd(query: string): Promise<SearchResult[]> {
  const response = await fetch(
    `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(query.toLowerCase())}.json`,
  );
  if (!response.ok) throw new SearchError("Film search failed");

  const data = await response.json();
  const suggestions: ImdbSuggestion[] = data.d ?? [];

  return suggestions.flatMap((film) => {
    if (!film.id || !IMDB_ID.test(film.id) || !film.l) return [];
    if (!film.qid || !FILM_KINDS.has(film.qid)) return [];
    return {
      type: "letterboxd" as const,
      mediaId: `https://letterboxd.com/imdb/${film.id}/`,
      title: film.l,
      subtitle: [film.y, film.s].filter(Boolean).join(" · ") || null,
      // Ask the image CDN for a small poster instead of the full-size one
      image:
        film.i?.imageUrl?.replace(/\._V1_.*\.jpg$/, "._V1_UX160_.jpg") ?? null,
      resolve: film.id,
    };
  });
}

// Follows Letterboxd's IMDb redirect to the film's canonical page
async function resolveLetterboxd(imdbId: string) {
  const response = await fetch(`https://letterboxd.com/imdb/${imdbId}/`, {
    redirect: "manual",
    headers: { "User-Agent": "Mozilla/5.0 (compatible; LinkBouquet/1.0)" },
  });
  const location = response.headers.get("location");
  if (!location) return null;

  const url = new URL(location, "https://letterboxd.com");
  const isFilmPage =
    url.hostname === "letterboxd.com" &&
    /^\/film\/[a-z0-9-]+\/?$/.test(url.pathname);
  return isFilmPage ? url.toString() : null;
}

const SEARCHERS: Record<string, (query: string) => Promise<SearchResult[]>> = {
  youtube: searchYouTube,
  spotify: searchSpotify,
  twitter: searchTwitter,
  letterboxd: searchLetterboxd,
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const source = params.get("source") ?? "";

  try {
    const resolve = params.get("resolve");
    if (source === "letterboxd" && resolve) {
      const mediaId = IMDB_ID.test(resolve)
        ? await resolveLetterboxd(resolve)
        : null;
      if (!mediaId) {
        return NextResponse.json(
          { error: "Not on Letterboxd" },
          { status: 404 },
        );
      }
      return NextResponse.json({ mediaId });
    }

    const search = Object.hasOwn(SEARCHERS, source) ? SEARCHERS[source] : null;
    const query = params.get("q")?.trim().slice(0, 100);
    if (!search || !query) {
      return NextResponse.json(
        { error: "source and q required" },
        { status: 400 },
      );
    }

    const cacheHeader =
      source === "twitter"
        ? "public, s-maxage=60, stale-while-revalidate=300"
        : "public, s-maxage=3600, stale-while-revalidate=86400";

    return NextResponse.json(
      { results: await search(query) },
      { headers: { "Cache-Control": cacheHeader } },
    );
  } catch (error) {
    if (error instanceof SearchError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
