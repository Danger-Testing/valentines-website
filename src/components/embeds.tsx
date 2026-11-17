"use client";

import { useState, useEffect, type ReactNode } from "react";
import type { MediaType } from "@/lib/supabase";
import { LetterboxdIcon, LinkIcon, SubstackIcon } from "./icons";

type EmbedProps = {
  mediaId: string;
  isModal: boolean;
};

// Thumbnail embeds open their link in a new tab when clicked on the canvas
type LinkEmbedProps = EmbedProps & {
  onLinkClick?: (e: React.MouseEvent) => void;
};

type LinkPreview = {
  image?: string | null;
  title?: string | null;
  year?: string | null;
  rating?: string | null;
};

// Fetches OG image/title (and film details for Letterboxd) for a URL
function useLinkPreview(endpoint: "og" | "letterboxd", url: string) {
  const [preview, setPreview] = useState<LinkPreview>({});

  useEffect(() => {
    fetch(`/api/${endpoint}?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then(setPreview)
      .catch(() => {});
  }, [endpoint, url]);

  return preview;
}

function InstagramEmbed({ mediaId, isModal }: EmbedProps) {
  if (isModal) {
    return (
      <div className="w-[min(400px,calc(100vw-2rem))] h-[min(780px,calc(100dvh-5rem))] overflow-hidden">
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

function YouTubeEmbed({ mediaId, isModal }: EmbedProps) {
  if (isModal) {
    return (
      <div className="w-[min(560px,calc(100vw-2rem))] aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${mediaId}?autoplay=1&playsinline=1`}
          className="border-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          // @ts-expect-error - playsInline is valid for iframes on iOS
          playsInline
        />
      </div>
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

function SpotifyEmbed({ mediaId, isModal }: EmbedProps) {
  const embedUrl = `https://open.spotify.com/embed/${mediaId}?utm_source=generator&theme=0`;

  if (isModal) {
    return (
      <div className="w-[min(400px,calc(100vw-2rem))] h-[152px] rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={embedUrl}
          width="100%"
          height="152"
          className="border-0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className="w-[300px] h-[80px] rounded-xl overflow-hidden shadow-lg">
      <iframe
        src={embedUrl}
        width="300"
        height="80"
        className="border-0 pointer-events-none"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </div>
  );
}

function TwitterEmbed({ mediaId, isModal }: EmbedProps) {
  const embedUrl = `https://platform.twitter.com/embed/Tweet.html?id=${mediaId}&dnt=true&hideCard=false&hideThread=true`;

  if (isModal) {
    return (
      <div className="w-[min(550px,calc(100vw-2rem))] h-[320px] bg-white rounded-xl overflow-hidden shadow-lg">
        <iframe
          src={embedUrl}
          width="100%"
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

// Canvas card shared by Substack and generic links: OG image with the title
// overlaid, or an icon and title while there is no image
function ThumbnailCard({
  thumbnail,
  title,
  onClick,
  overlayIcon,
  fallbackIcon,
}: {
  thumbnail?: string | null;
  title: string;
  onClick?: (e: React.MouseEvent) => void;
  overlayIcon?: ReactNode;
  fallbackIcon: ReactNode;
}) {
  return (
    <div
      onClick={onClick}
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
              {overlayIcon}
              <span className="text-[10px] text-white font-medium truncate">
                {title}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-3 flex flex-col justify-center items-center">
          {fallbackIcon}
          <span className="text-xs text-gray-600 font-medium text-center line-clamp-2">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}

function SubstackEmbed({ mediaId: url, isModal, onLinkClick }: LinkEmbedProps) {
  const preview = useLinkPreview("og", url);
  const slug = url.split("/p/")[1]?.replace(/\?.*$/, "");
  const title =
    preview.title || slug?.replace(/-/g, " ") || "Substack Article";

  if (isModal) {
    return (
      <div className="w-[min(600px,calc(100vw-2rem))] h-[min(80dvh,calc(100dvh-5rem))] bg-white rounded-xl overflow-hidden">
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
    <ThumbnailCard
      thumbnail={preview.image}
      title={title}
      onClick={onLinkClick}
      overlayIcon={
        <SubstackIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      }
      fallbackIcon={<SubstackIcon className="w-10 h-10 text-gray-500 mb-2" />}
    />
  );
}

function LetterboxdEmbed({
  mediaId: url,
  isModal,
  onLinkClick,
}: LinkEmbedProps) {
  const { image: poster, year, rating, ...preview } = useLinkPreview(
    "letterboxd",
    url,
  );
  const filmSlug = url.match(/letterboxd\.com\/film\/([a-zA-Z0-9-]+)/)?.[1];
  const title = preview.title || filmSlug?.replace(/-/g, " ") || "";

  if (isModal) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer"
      >
        <div className="w-[min(300px,calc(100vw-2rem))] bg-[#14181c] rounded-xl overflow-hidden shadow-lg">
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-full h-[min(450px,55dvh)] object-cover"
            />
          ) : (
            <div className="w-full h-[min(450px,55dvh)] bg-[#2c3440] flex items-center justify-center">
              <div className="w-20 h-20 bg-[#00e054] rounded-full flex items-center justify-center">
                <LetterboxdIcon className="w-10 h-10 text-[#14181c]" />
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
    <div onClick={onLinkClick} className="block cursor-pointer">
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
              <LetterboxdIcon className="w-5 h-5 text-[#14181c]" />
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

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Link";
  }
}

function LinkEmbed({ mediaId: url, isModal, onLinkClick }: LinkEmbedProps) {
  const preview = useLinkPreview("og", url);
  const thumbnail = preview.image;
  const title = preview.title || hostnameOf(url);

  if (isModal) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer"
      >
        <div className="w-[min(400px,calc(100vw-2rem))] bg-white rounded-xl overflow-hidden shadow-lg">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-[min(250px,35dvh)] object-cover"
            />
          ) : (
            <div className="w-full h-[min(250px,35dvh)] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <LinkIcon className="w-16 h-16 text-gray-400" strokeWidth={1.5} />
            </div>
          )}
          <div className="p-4">
            <h3 className="text-black font-medium text-lg line-clamp-2">
              {title}
            </h3>
            <p className="text-gray-500 text-sm truncate">{url}</p>
          </div>
        </div>
      </a>
    );
  }

  return (
    <ThumbnailCard
      thumbnail={thumbnail}
      title={title}
      onClick={onLinkClick}
      fallbackIcon={
        <LinkIcon className="w-10 h-10 text-gray-400 mb-2" strokeWidth={1.5} />
      }
    />
  );
}

// Renders the right embed for a media item, on the canvas or in the modal
export function MediaEmbed({
  type,
  ...props
}: LinkEmbedProps & { type: MediaType }) {
  switch (type) {
    case "instagram":
      return <InstagramEmbed {...props} />;
    case "youtube":
      return <YouTubeEmbed {...props} />;
    case "spotify":
      return <SpotifyEmbed {...props} />;
    case "twitter":
      return <TwitterEmbed {...props} />;
    case "substack":
      return <SubstackEmbed {...props} />;
    case "letterboxd":
      return <LetterboxdEmbed {...props} />;
    case "link":
      return <LinkEmbed {...props} />;
    default:
      return null;
  }
}
