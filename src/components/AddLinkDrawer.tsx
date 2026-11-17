"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { MediaType } from "@/lib/supabase";
import type { SearchResult, SearchSource } from "@/lib/search";
import { fitToVisualViewport } from "@/lib/viewport";
import {
  LetterboxdIcon,
  SpotifyIcon,
  XIcon,
  YouTubeIcon,
} from "./icons";

type Source = {
  id: SearchSource | "twitter";
  label: string;
  placeholder: string;
  bg: string;
  icon: ReactNode;
  // Services without a search we can query open their own search in a new tab
  externalUrl?: (query: string) => string;
};

const SOURCES: Source[] = [
  {
    id: "spotify",
    label: "Spotify",
    placeholder: "Search songs on Spotify",
    bg: "bg-[#1DB954]",
    icon: <SpotifyIcon className="w-5 h-5 text-white" />,
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "Search videos on YouTube",
    bg: "bg-[#FF0000]",
    icon: <YouTubeIcon className="w-5 h-5 text-white" />,
  },
  {
    id: "twitter",
    label: "X",
    placeholder: "Search posts on X",
    bg: "bg-black",
    icon: <XIcon className="w-4 h-4 text-white" />,
    externalUrl: (query) =>
      `https://x.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    id: "letterboxd",
    label: "Letterboxd",
    placeholder: "Search films on Letterboxd",
    bg: "bg-[#00e054]",
    icon: <LetterboxdIcon className="w-5 h-5 text-[#14181c]" />,
  },
];

// Result thumbnails keep each service's shape: poster, video frame, cover
const THUMBNAIL_SIZE: Partial<Record<MediaType, string>> = {
  letterboxd: "w-8 h-12",
  youtube: "w-16 h-9",
};

type Found = {
  sourceId: Source["id"];
  query: string;
  results: SearchResult[];
  error: string | null;
};

// Sheet for adding to the bouquet: paste a link, or pick a service and search
// it. With a mouse it is a drawer at the bottom of the screen. On touch
// screens it sits at the top instead: the field is then already clear of the
// keyboard when it opens, so nothing has to move out of the keyboard's way.
export function AddLinkDrawer({
  onAdd,
  onSubmitUrl,
  onError,
  onClose,
}: {
  onAdd: (type: MediaType, mediaId: string) => void;
  onSubmitUrl: (url: string) => void;
  onError: (message: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sourceId, setSourceId] = useState<Source["id"] | null>(null);
  const [found, setFound] = useState<Found | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const source = SOURCES.find((s) => s.id === sourceId) ?? null;
  const trimmed = query.trim();
  // A pasted link is always added as a link, whichever service is selected
  const isUrl = /^https?:\/\//i.test(trimmed);
  const isExternal = Boolean(source?.externalUrl) && !isUrl;
  const isSearch = source !== null && !source.externalUrl && !isUrl;
  const canSearch = isSearch && trimmed.length >= 2;
  // The last results for this service stay up while the next ones load, so
  // the list does not flicker on every keystroke
  const shown = canSearch && found?.sourceId === sourceId ? found : null;
  const isLoading = canSearch && shown?.query !== trimmed;

  useEffect(() => {
    if (!canSearch || !sourceId) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?source=${sourceId}&q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        setFound({
          sourceId,
          query: trimmed,
          results: response.ok ? (data.results ?? []) : [],
          error: response.ok ? null : (data.error ?? "Search failed"),
        });
      } catch {
        if (controller.signal.aborted) return;
        setFound({
          sourceId,
          query: trimmed,
          results: [],
          error: "Search failed",
        });
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [canSearch, sourceId, trimmed]);

  const pick = async (result: SearchResult) => {
    if (isAdding) return;
    let mediaId = result.mediaId;

    if (result.resolve) {
      setIsAdding(true);
      try {
        const response = await fetch(
          `/api/search?source=${result.type}&resolve=${encodeURIComponent(result.resolve)}`,
        );
        const data = await response.json();
        if (!response.ok || !data.mediaId) throw new Error("Not found");
        mediaId = data.mediaId;
      } catch {
        setIsAdding(false);
        onError(`Could not find "${result.title}" on Letterboxd`);
        return;
      }
    }

    onAdd(result.type, mediaId);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSearch) {
      // Results are added by tapping them; return just puts the keyboard
      // away so more of the list is visible
      inputRef.current?.blur();
    } else if (isExternal && source?.externalUrl) {
      if (trimmed) {
        window.open(
          source.externalUrl(trimmed),
          "_blank",
          "noopener,noreferrer",
        );
      }
    } else {
      onSubmitUrl(trimmed);
    }
  };

  const status = !isSearch
    ? null
    : !canSearch
      ? `Type to search ${source?.label}`
      : !shown || (isLoading && shown.results.length === 0)
        ? "Searching…"
        : isLoading
          ? null
          : (shown.error ??
            (shown.results.length === 0 ? "No results" : null));

  return (
    // touch-none: with the keyboard up, a drag would otherwise slide the whole
    // page around underneath it. Only the scrollable parts take drags.
    <div
      ref={fitToVisualViewport}
      role="dialog"
      aria-modal="true"
      aria-labelledby="url-modal-title"
      className="fixed inset-0 z-50 flex items-start pointer-fine:items-end justify-center touch-none"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-lg max-h-full overflow-y-auto overscroll-contain touch-pan-y bg-white/80 backdrop-blur-xl shadow-xl animate-sheet-in px-4 sm:px-6 pb-4 pt-[max(1rem,env(safe-area-inset-top))] rounded-b-2xl pointer-fine:py-6 pointer-fine:rounded-b-none pointer-fine:rounded-t-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer handle */}
        <div className="hidden pointer-fine:flex justify-center mb-4">
          <div className="w-12 h-1.5 bg-black/20 rounded-full" />
        </div>
        <h2 id="url-modal-title" className="sr-only">
          Add a link
        </h2>
        {/* Hidden while searching to leave the room to results */}
        {!source && (
          <p className="text-black text-sm mb-4">
            Paste a link here or use ⌘V anywhere on the canvas. Works with
            YouTube, Spotify, TikTok, Substack & more. Or pick a service below
            to search it.
          </p>
        )}
        <input
          ref={inputRef}
          type="text"
          name="url"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={source ? source.placeholder : "https://..."}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint={source ? "search" : "go"}
          // 16px keeps iOS from zooming the page when the field is focused
          className="w-full px-4 py-3 rounded-xl border-none bg-black/10 focus:outline-none mb-3 text-base"
          autoFocus
        />

        {/* Services to search */}
        <div className="flex gap-2 mb-4">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSourceId(sourceId === s.id ? null : s.id);
                inputRef.current?.focus();
              }}
              aria-label={`Search ${s.label}`}
              aria-pressed={sourceId === s.id}
              title={`Search ${s.label}`}
              className={`w-11 h-11 ${s.bg} rounded-lg flex items-center justify-center cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 ${
                sourceId === s.id
                  ? "scale-110"
                  : sourceId
                    ? "opacity-40 hover:opacity-100"
                    : "hover:scale-110"
              }`}
            >
              {s.icon}
            </button>
          ))}
        </div>

        {isExternal && source && (
          <p className="text-black/60 text-sm mb-4">
            {source.label} can only be searched on {source.label} itself.
            Search opens it in a new tab — copy the link of the post you want
            and paste it here.
          </p>
        )}

        {/* A fixed-size list, so the sheet does not change size while results
            come in; it shrinks to fit above the keyboard */}
        {isSearch && (
          <div
            aria-live="polite"
            className={`basis-64 shrink min-h-0 flex flex-col gap-2 mb-4 overflow-y-auto overscroll-contain touch-pan-y transition-opacity ${
              isLoading && !status ? "opacity-50" : ""
            }`}
          >
            {status && <p className="text-black/50 text-sm">{status}</p>}
            {shown?.results.map((result) => (
              <button
                key={result.mediaId}
                type="button"
                onClick={() => pick(result)}
                disabled={isAdding}
                className="shrink-0 w-full p-2 bg-white hover:bg-white/80 rounded-lg transition-colors text-left flex items-center gap-3 cursor-pointer disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
              >
                {result.image && (
                  <img
                    src={result.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className={`${THUMBNAIL_SIZE[result.type] ?? "w-10 h-10"} rounded object-cover flex-shrink-0 bg-black/10`}
                  />
                )}
                <span className="flex-1 min-w-0">
                  <span className="text-black text-sm font-medium truncate block">
                    {result.title}
                  </span>
                  {result.subtitle && (
                    <span className="text-black/50 text-xs truncate block">
                      {result.subtitle}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 pointer-fine:pb-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#E6E6E6]/50 backdrop-blur-md text-black rounded-lg transition-colors font-medium cursor-pointer"
          >
            Close
          </button>
          {/* Search results are added by tapping them, so no Add button */}
          {!isSearch && (
            <button
              type="submit"
              disabled={isExternal && !trimmed}
              className="flex-1 px-4 py-3 bg-[#DB234F] backdrop-blur-md text-white rounded-lg transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-default"
            >
              {isExternal ? "Search ↗" : "Add"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
