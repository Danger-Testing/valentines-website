"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { loadAllBouquets, type PublicBouquet, type MediaItem, type MediaType } from "@/lib/supabase";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      <p className="text-black font-medium">Loading gallery...</p>
    </div>
  );
}

// Mini preview icons for each media type
function MiniEmbed({ type }: { type: MediaType }) {
  const baseClasses = "w-full h-full rounded-lg flex items-center justify-center shadow-md";

  switch (type) {
    case "youtube":
      return (
        <div className={`${baseClasses} bg-black`}>
          <svg className="w-1/2 h-1/2 text-[#FF0000]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
      );
    case "spotify":
      return (
        <div className={`${baseClasses} bg-[#1DB954]`}>
          <svg className="w-1/2 h-1/2 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
        </div>
      );
    case "instagram":
      return (
        <div className={`${baseClasses} bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]`}>
          <svg className="w-1/2 h-1/2 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
      );
    case "twitter":
      return (
        <div className={`${baseClasses} bg-black`}>
          <svg className="w-1/2 h-1/2 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      );
    case "substack":
      return (
        <div className={`${baseClasses} bg-[#FF6719]`}>
          <svg className="w-1/2 h-1/2 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
          </svg>
        </div>
      );
    case "letterboxd":
      return (
        <div className={`${baseClasses} bg-[#14181c]`}>
          <svg className="w-1/2 h-1/2 text-[#00e054]" fill="currentColor" viewBox="0 0 500 500">
            <path d="M250 0C111.93 0 0 111.93 0 250s111.93 250 250 250 250-111.93 250-250S388.07 0 250 0zm0 472.73C128.52 472.73 27.27 371.48 27.27 250S128.52 27.27 250 27.27 472.73 128.52 472.73 250 371.48 472.73 250 472.73z" />
            <circle cx="250" cy="250" r="110" />
          </svg>
        </div>
      );
    case "link":
    default:
      return (
        <div className={`${baseClasses} bg-gray-100`}>
          <svg className="w-1/2 h-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
      );
  }
}

function BouquetCard({ bouquet }: { bouquet: PublicBouquet }) {
  const itemCount = bouquet.items?.length || 0;
  const items = bouquet.items || [];

  return (
    <Link
      href={`/?b=${bouquet.slug}`}
      className="group block rounded-2xl overflow-hidden transition-all hover:scale-[1.02]"
    >
      <div
        className="relative aspect-[3/4] overflow-hidden"
        style={{ backgroundColor: bouquet.bg_color || "#ffffff" }}
      >
        {/* Media items positioned like on the canvas */}
        {items.map((item: MediaItem) => (
          <div
            key={item.id}
            className="absolute z-10"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale * 0.4})`,
              width: "60px",
              height: "40px",
            }}
          >
            <MiniEmbed type={item.type} />
          </div>
        ))}

        {/* Flower image */}
        <div className="absolute inset-x-0 -bottom-[40%] -top-[10%]">
          <Image
            src={bouquet.image_url || "/flowers.png"}
            alt="Bouquet"
            fill
            className="object-contain"
          />
        </div>

        {/* Overlay with info on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center pb-4 z-20">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-black text-sm font-medium">
              {itemCount} {itemCount === 1 ? "link" : "links"}
            </p>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="bg-[#E6E6E6]/50 backdrop-blur-md p-4">
        {bouquet.from_name || bouquet.to_name ? (
          <p className="text-black font-medium truncate">
            {bouquet.from_name && bouquet.to_name
              ? `${bouquet.from_name} + ${bouquet.to_name}`
              : bouquet.from_name || bouquet.to_name}
          </p>
        ) : (
          <p className="text-black/50 font-medium">Anonymous</p>
        )}
        <p className="text-black/40 text-sm">
          {new Date(bouquet.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
}

export default function GalleryClient() {
  const [bouquets, setBouquets] = useState<PublicBouquet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllBouquets().then((result) => {
      if ("error" in result) {
        setError(result.error);
      } else {
        setBouquets(result);
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Logo top left - same as main page */}
      <Link href="/" className="fixed top-4 left-4 md:top-6 md:left-6 z-20 cursor-pointer">
        <Image
          src="/logo.png"
          alt="Link Bouquet"
          width={500}
          height={400}
          className="h-36 md:h-56 w-auto"
        />
      </Link>

      {/* Link image bottom left - same as main page */}
      <div className="fixed bottom-0 left-0 z-40 hidden md:block pointer-events-none">
        <Image
          src="/link.png"
          alt=""
          width={400}
          height={400}
          className="w-36 h-36 object-contain"
        />
      </div>

      {/* Turtle top right - same as main page */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-40">
        <a
          href="https://dangertesting.com"
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer"
        >
          <Image
            src="/turtle.png"
            alt="Turtle"
            width={150}
            height={150}
            className="w-12 h-12 md:w-20 md:h-20"
          />
        </a>
      </div>

      {/* Make your own button bottom right */}
      <div className="fixed bottom-6 right-4 md:right-6 z-40">
        <Link
          href="/"
          className="h-12 px-6 rounded-lg bg-[#DB234F] hover:bg-[#B81D42] transition-all flex items-center justify-center text-white cursor-pointer"
        >
          <span className="font-medium text-sm md:text-base">Make Your Own</span>
        </Link>
      </div>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 pt-44 md:pt-64 pb-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-black">
            Bouquet Gallery
          </h1>
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : bouquets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-black/50 text-lg mb-4">No bouquets yet!</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#DB234F] hover:bg-[#B81D42] text-white rounded-lg font-medium transition-colors"
            >
              Create the first one
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {bouquets.map((bouquet) => (
              <BouquetCard key={bouquet.slug} bouquet={bouquet} />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
