/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { MediaType } from "@/lib/supabase";
import type { SearchResult, SearchSource } from "@/lib/search";
import {
  InstagramIcon,
  LetterboxdIcon,
  SpotifyIcon,
  XIcon,
  YouTubeIcon,
} from "./icons";

type Source = {
  id: SearchSource | "instagram";
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
    id: "instagram",
    label: "Instagram",
    placeholder: "Search Instagram",
    bg: "bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5]",
    icon: <InstagramIcon className="w-5 h-5 text-white" />,
    externalUrl: (query) =>
      `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(query)}`,
  },
  {
    id: "twitter",
    label: "X",
    placeholder: "Search posts on X",
    bg: "bg-black",
    icon: <XIcon className="w-4 h-4 text-white" />,
  },
  {
    id: "letterboxd",
    label: "Letterboxd",
    placeholder: "Search films on Letterboxd",
    bg: "bg-[#00e054]",
    icon: <LetterboxdIcon className="w-5 h-5 text-[#14181c]" />,
  },
];

// Result thumbnails keep each service's shape: poster, video frame, avatar, cover
const THUMBNAIL_STYLE: Partial<Record<MediaType, string>> = {
  letterboxd: "w-8 h-12 rounded",
  youtube: "w-16 h-9 rounded",
  twitter: "w-10 h-10 rounded-full",
};

type Found = { key: string; results: SearchResult[]; error: string | null };

// Bottom drawer for adding to the bouquet: paste a link, or pick a service
// and search it
export function AddLinkDrawer({
  onAdd,
  onSubmitUrl,
  onError,
  onClose,
}: {
  onAdd: (type: MediaType, mediaId: string) => void;
  onSubmitUrl: (url: string) => boolean;
  onError: (message: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sourceId, setSourceId] = useState<Source["id"] | null>(null);
  const [found, setFound] = useState<Found | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const source = SOURCES.find((s) => s.id === sourceId) ?? null;
  const trimmed = query.trim();
  // A pasted link is always added as a link, whichever service is selected
  const isUrl = /^https?:\/\//i.test(trimmed);
  const isExternal = Boolean(source?.externalUrl) && !isUrl;
  const searchKey =
    source && !source.externalUrl && !isUrl && trimmed.length >= 2
      ? `${source.id}:${trimmed}`
      : null;
  // Results only count while they match what is typed right now
  const current = found?.key === searchKey ? found : null;

  useEffect(() => {
    // Keep validation beside the field visible in a short keyboard viewport.
    if (inputError && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [inputError]);

  useEffect(() => {
    if (!searchKey) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?source=${sourceId}&q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        setFound({
          key: searchKey,
          results: response.ok ? (data.results ?? []) : [],
          error: response.ok ? null : (data.error ?? "Search failed"),
        });
      } catch {
        if (controller.signal.aborted) return;
        setFound({ key: searchKey, results: [], error: "Search failed" });
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchKey, sourceId, trimmed]);

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

    inputRef.current?.blur();
    onAdd(result.type, mediaId);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!source || isUrl) {
      if (onSubmitUrl(trimmed)) {
        inputRef.current?.blur();
      } else {
        setInputError("Please enter a domain or link, like example.com");
        inputRef.current?.focus({ preventScroll: true });
      }
    } else if (source.externalUrl) {
      if (trimmed) {
        window.open(
          source.externalUrl(trimmed),
          "_blank",
          "noopener,noreferrer",
        );
      }
    } else if (current?.results[0]) {
      // Enter adds the top result
      pick(current.results[0]);
    }
  };

  const canSubmit =
    !source || isUrl
      ? true
      : source.externalUrl
        ? trimmed.length > 0
        : Boolean(current?.results.length) && !isAdding;

  return (
    <div
      role="dialog"
      tabIndex={-1}
      aria-modal="true"
      aria-labelledby="url-modal-title"
      className="dialog-viewport dialog-drawer fixed inset-0 z-50 flex items-end justify-center bg-black/10"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="dialog-panel flex flex-col bg-white/80 backdrop-blur-xl rounded-t-2xl shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={scrollRef}
          className="dialog-scroll min-h-0 overflow-y-auto overscroll-contain px-6 pt-6"
        >
          {/* Drawer handle */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1.5 bg-black/20 rounded-full" />
          </div>
          <h2 id="url-modal-title" className="sr-only">
            Add a link
          </h2>
          <p className="text-black text-sm mb-4">
            Enter a domain or paste a link here. You can also paste directly
            onto the canvas. Works with YouTube, Spotify, TikTok, Substack &
            more.
          </p>
          <input
            ref={inputRef}
            type="text"
            name="url"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setInputError(null);
            }}
            inputMode={!source || isUrl ? "url" : "search"}
            enterKeyHint={!source || isUrl ? "done" : "search"}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            aria-label={source ? source.placeholder : "Domain or link"}
            aria-invalid={Boolean(inputError)}
            aria-describedby={inputError ? "link-input-error" : undefined}
            placeholder={source ? source.placeholder : "example.com or any link"}
            className="w-full px-4 py-3 rounded-xl border-none bg-black/10 focus:outline-none mb-3"
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
                  setInputError(null);
                  inputRef.current?.focus({ preventScroll: true });
                }}
                aria-label={`Search ${s.label}`}
                aria-pressed={sourceId === s.id}
                title={`Search ${s.label}`}
                className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 ${
                  sourceId === s.id
                    ? "scale-110 ring-2 ring-white"
                    : sourceId
                      ? "opacity-40 hover:opacity-100"
                      : "hover:scale-110"
                }`}
              >
                {s.icon}
              </button>
            ))}
          </div>

          {inputError && (
            <p
              id="link-input-error"
              role="alert"
              className="mb-4 text-sm text-red-800"
            >
              {inputError}
            </p>
          )}

          {isExternal && source && (
            <p className="text-black/60 text-sm mb-4">
              {source.label} can only be searched on {source.label} itself.
              Search opens it in a new tab — copy the link of the post you want
              and paste it here.
            </p>
          )}

          {searchKey && (
            <div
              aria-live="polite"
              className="flex flex-col gap-2 mb-4 max-h-[min(264px,36dvh)] overflow-y-auto overscroll-contain"
            >
              {!current && <p className="text-black/50 text-sm">Searching…</p>}
              {current?.error && (
                <p className="text-black/60 text-sm">{current.error}</p>
              )}
              {current && !current.error && current.results.length === 0 && (
                <p className="text-black/50 text-sm">No results</p>
              )}
              {current?.results.map((result) => (
                <button
                  key={result.mediaId}
                  type="button"
                  onClick={() => pick(result)}
                  disabled={isAdding}
                  className="w-full p-2 bg-white hover:bg-white/80 rounded-lg transition-colors text-left flex items-center gap-3 cursor-pointer disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                >
                  {result.image && (
                    <img
                      src={result.image}
                      alt=""
                      referrerPolicy="no-referrer"
                      className={`${THUMBNAIL_STYLE[result.type] ?? "w-10 h-10 rounded"} object-cover flex-shrink-0 bg-black/10`}
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
        </div>
        <div className="dialog-actions flex shrink-0 gap-3 px-6 pt-2 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[#E6E6E6]/50 backdrop-blur-md text-black rounded-lg transition-colors font-medium cursor-pointer"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 px-4 py-3 bg-[#DB234F] backdrop-blur-md text-white rounded-lg transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            {isExternal ? "Search ↗" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
