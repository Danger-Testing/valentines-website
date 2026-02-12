"use client";

import { useState, useEffect } from "react";

// Instagram embed component
export function InstagramEmbed({
  mediaId,
  isModal,
}: {
  mediaId: string;
  isModal: boolean;
}) {
  if (isModal) {
    return (
      <div className="w-[400px] h-[780px] overflow-hidden">
        <iframe
          src={`https://www.instagram.com/reel/${mediaId}/embed`}
          width="540"
          height="1000"
          className="border-0"
          style={{ marginLeft: "-70px", marginTop: "-55px" }}
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="overflow-hidden w-[180px] h-[320px] rounded-xl shadow-lg bg-white">
      <iframe
        src={`https://www.instagram.com/reel/${mediaId}/embed`}
        width="300"
        height="500"
        className="border-0 pointer-events-none"
        style={{ marginLeft: "-60px", marginTop: "-45px" }}
        scrolling="no"
      />
    </div>
  );
}

// YouTube embed component
export function YouTubeEmbed({
  mediaId,
  isModal,
}: {
  mediaId: string;
  isModal: boolean;
}) {
  if (isModal) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${mediaId}?autoplay=1&playsinline=1`}
        width="560"
        height="315"
        className="border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        // @ts-expect-error - playsInline is valid for iframes on iOS
        playsInline
      />
    );
  }
  return (
    <div className="w-[280px] h-[158px] bg-black rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={`https://www.youtube.com/embed/${mediaId}?playsinline=1`}
        width="280"
        height="158"
        className="border-0 pointer-events-none"
        scrolling="no"
        // @ts-expect-error - playsInline is valid for iframes on iOS
        playsInline
      />
    </div>
  );
}

// Spotify embed component
export function SpotifyEmbed({
  mediaId,
  isModal,
}: {
  mediaId: string;
  isModal: boolean;
}) {
  const embedUrl = `https://open.spotify.com/embed/${mediaId}?utm_source=generator&theme=0`;

  if (isModal) {
    return (
      <div className="w-[400px] h-[352px] rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={embedUrl}
          width="480"
          height="352"
          className="border-0"
          style={{ marginRight: "-80px" }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className="w-[220px] h-[80px] rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={embedUrl}
        width="340"
        height="80"
        className="border-0 pointer-events-none"
        style={{ marginRight: "-120px" }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}

// Twitter/X embed component
export function TwitterEmbed({
  mediaId,
  isModal,
}: {
  mediaId: string;
  isModal: boolean;
}) {
  const embedUrl = `https://platform.twitter.com/embed/Tweet.html?id=${mediaId}&dnt=true&hideCard=false&hideThread=true`;

  if (isModal) {
    return (
      <div className="w-[550px] h-[320px] bg-white rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={embedUrl}
          width="550"
          height="480"
          className="border-0"
          style={{ marginBottom: "-160px" }}
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="w-[280px] h-[160px] bg-white rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={embedUrl}
        width="280"
        height="320"
        className="border-0 pointer-events-none"
        style={{ marginBottom: "-160px" }}
        scrolling="no"
      />
    </div>
  );
}

// Substack thumbnail component that fetches OG image
export function SubstackEmbed({
  url,
  isModal,
  onLinkClick,
}: {
  url: string;
  isModal: boolean;
  onLinkClick?: (e: React.MouseEvent) => void;
}) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    const slug = url.split("/p/")[1]?.replace(/\?.*$/, "");
    setTitle(slug?.replace(/-/g, " ") || "Substack Article");

    fetch(`/api/og?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.image) setThumbnail(data.image);
        if (data.title) setTitle(data.title);
      })
      .catch(() => {});
  }, [url]);

  if (isModal) {
    return (
      <div className="w-[600px] h-[80vh] bg-white rounded-xl overflow-hidden">
        <iframe
          src={`${url}?embedded=true`}
          width="100%"
          height="100%"
          className="border-0"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      onClick={onLinkClick}
      className="block w-[200px] h-[140px] rounded-xl overflow-hidden shadow-lg bg-white hover:shadow-xl transition-shadow cursor-pointer"
    >
      {thumbnail ? (
        <div className="w-full h-full relative">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
              </svg>
              <span className="text-[10px] text-white font-medium truncate">
                {title}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-3 flex flex-col justify-center items-center">
          <svg
            className="w-10 h-10 text-gray-500 mb-2"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
          </svg>
          <span className="text-xs text-gray-600 font-medium text-center line-clamp-2">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}

// Letterboxd thumbnail component that fetches movie poster
export function LetterboxdEmbed({
  url,
  isModal,
  onLinkClick,
}: {
  url: string;
  isModal: boolean;
  onLinkClick?: (e: React.MouseEvent) => void;
}) {
  const [poster, setPoster] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [year, setYear] = useState<string | null>(null);
  const [rating, setRating] = useState<string | null>(null);

  useEffect(() => {
    const filmMatch = url.match(/letterboxd\.com\/film\/([a-zA-Z0-9-]+)/);
    if (filmMatch) {
      setTitle(filmMatch[1].replace(/-/g, " "));
    }

    fetch(`/api/letterboxd?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.image) setPoster(data.image);
        if (data.title) setTitle(data.title);
        if (data.year) setYear(data.year);
        if (data.rating) setRating(data.rating);
      })
      .catch(() => {});
  }, [url]);

  if (isModal) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer"
      >
        <div className="w-[300px] bg-[#14181c] rounded-xl overflow-hidden shadow-lg">
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-full h-[450px] object-cover"
            />
          ) : (
            <div className="w-full h-[450px] bg-[#2c3440] flex items-center justify-center">
              <div className="w-20 h-20 bg-[#00e054] rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-[#14181c]"
                  fill="currentColor"
                  viewBox="0 0 500 500"
                >
                  <path d="M250 0C111.93 0 0 111.93 0 250s111.93 250 250 250 250-111.93 250-250S388.07 0 250 0zm0 472.73C128.52 472.73 27.27 371.48 27.27 250S128.52 27.27 250 27.27 472.73 128.52 472.73 250 371.48 472.73 250 472.73z" />
                  <circle cx="250" cy="250" r="110" />
                </svg>
              </div>
            </div>
          )}
          <div className="p-4">
            <h3 className="text-white font-medium text-lg capitalize">
              {title}
            </h3>
            {year && <span className="text-[#9ab] text-sm">{year}</span>}
            {rating && (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[#00e054]">
                  {"★".repeat(Math.floor(parseFloat(rating)))}
                </span>
                <span className="text-[#9ab] text-sm">{rating}/5</span>
              </div>
            )}
          </div>
        </div>
      </a>
    );
  }

  return (
    <div
      onClick={onLinkClick}
      className="block cursor-pointer"
    >
      <div className="w-[140px] h-[210px] bg-[#14181c] rounded-xl overflow-hidden shadow-lg">
        {poster ? (
          <div className="relative w-full h-full">
            <img
              src={poster}
              alt={title}
              className="w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
              <span className="text-white text-[10px] font-medium line-clamp-2 capitalize">
                {title}
              </span>
              {year && (
                <span className="text-[#9ab] text-[9px] block">{year}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3">
            <div className="w-10 h-10 bg-[#00e054] rounded-full flex items-center justify-center mb-2">
              <svg
                className="w-5 h-5 text-[#14181c]"
                fill="currentColor"
                viewBox="0 0 500 500"
              >
                <path d="M250 0C111.93 0 0 111.93 0 250s111.93 250 250 250 250-111.93 250-250S388.07 0 250 0zm0 472.73C128.52 472.73 27.27 371.48 27.27 250S128.52 27.27 250 27.27 472.73 128.52 472.73 250 371.48 472.73 250 472.73z" />
                <circle cx="250" cy="250" r="110" />
              </svg>
            </div>
            <span className="text-white text-xs font-medium text-center capitalize line-clamp-2">
              {title}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Generic link thumbnail component that fetches OG image
export function LinkEmbed({
  url,
  isModal,
  onLinkClick,
}: {
  url: string;
  isModal: boolean;
  onLinkClick?: (e: React.MouseEvent) => void;
}) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    try {
      const parsed = new URL(url);
      setTitle(parsed.hostname.replace("www.", ""));
    } catch {
      setTitle("Link");
    }

    fetch(`/api/og?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.image) setThumbnail(data.image);
        if (data.title) setTitle(data.title);
      })
      .catch(() => {});
  }, [url]);

  if (isModal) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer"
      >
        <div className="w-[400px] bg-white rounded-xl overflow-hidden shadow-lg">
          {thumbnail ? (
            <img src={thumbnail} alt={title} className="w-full h-[250px] object-cover" />
          ) : (
            <div className="w-full h-[250px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          )}
          <div className="p-4">
            <h3 className="text-black font-medium text-lg line-clamp-2">{title}</h3>
            <p className="text-gray-500 text-sm truncate">{url}</p>
          </div>
        </div>
      </a>
    );
  }

  return (
    <div
      onClick={onLinkClick}
      className="block w-[200px] h-[140px] rounded-xl overflow-hidden shadow-lg bg-white hover:shadow-xl transition-shadow cursor-pointer"
    >
      {thumbnail ? (
        <div className="w-full h-full relative">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <span className="text-[10px] text-white font-medium truncate block">
              {title}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-3 flex flex-col justify-center items-center">
          <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-xs text-gray-600 font-medium text-center line-clamp-2">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
