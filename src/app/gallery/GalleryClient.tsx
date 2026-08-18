"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadAllBouquets, type MediaItem, type PublicBouquet } from "@/lib/supabase";

type Camera = { x: number; y: number; zoom: number };
type Point = { x: number; y: number; rotation: number };

const PETAL_ARMS = 8;
const INNER_BLOSSOM = 64;
const TILE_WIDTH = 68;
const TILE_HEIGHT = 48;

function flowerPosition(index: number, total: number): Point {
  if (index < INNER_BLOSSOM) {
    const ring = Math.floor(index / 16);
    const angle = index * 2.399;
    const radius = 30 + ring * 44;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      rotation: (angle * 180) / Math.PI + 90 + Math.sin(index * 4.71) * 8,
    };
  }

  const petalIndex = index - INNER_BLOSSOM;
  const arm = petalIndex % PETAL_ARMS;
  const step = Math.floor(petalIndex / PETAL_ARMS);
  const perArm = Math.ceil(Math.max(1, total - INNER_BLOSSOM) / PETAL_ARMS);
  const progress = perArm <= 1 ? 0 : step / (perArm - 1);
  const petalAngle = (arm / PETAL_ARMS) * Math.PI * 2;
  const curl = (arm % 2 === 0 ? 1 : -1) * Math.sin(progress * Math.PI) * 0.23;
  const angle = petalAngle + curl + Math.sin(index * 17.31) * 0.018;
  const radius = 64 + Math.pow(progress, 0.76) * Math.max(820, Math.sqrt(total) * 14);
  const spread = Math.sin(progress * Math.PI) * 62 + Math.sin(index * 9.17) * 12;
  const normalAngle = angle + Math.PI / 2;

  return {
    x: Math.cos(angle) * radius + Math.cos(normalAngle) * spread,
    y: Math.sin(angle) * radius + Math.sin(normalAngle) * spread,
    rotation: Math.sin(index * 4.71) * 10 + (angle * 180) / Math.PI + 90,
  };
}

function LoadingFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white text-black">
      <p className="text-sm text-black/45">Gathering the bouquets…</p>
    </main>
  );
}

const MEDIA_STYLES: Record<string, string> = {
  youtube: "bg-[#ff0033]",
  spotify: "bg-[#1db954]",
  instagram: "bg-[#c13584]",
  twitter: "bg-black",
  substack: "bg-[#ff6719]",
  letterboxd: "bg-[#14181c]",
  tiktok: "bg-[#111111]",
  link: "bg-white text-black",
};

function MiniLink({ item }: { item: MediaItem }) {
  const label = item.type === "instagram" ? "IG" : item.type.slice(0, 2).toUpperCase();
  return (
    <div
      className={`flex h-5 w-7 items-center justify-center border border-black/15 px-0.5 text-[7px] font-semibold leading-none text-white shadow-[0_1px_4px_rgba(0,0,0,0.22)] ${MEDIA_STYLES[item.type] || MEDIA_STYLES.link}`}
    >
      {label}
    </div>
  );
}

function PreviewTile({ bouquet, point }: { bouquet: PublicBouquet; point: Point }) {
  return (
    <div
      className="group bouquet-preview absolute"
      style={{
        width: TILE_WIDTH,
        height: TILE_HEIGHT,
        left: `calc(50% + ${point.x}px)`,
        top: `calc(50% + ${point.y}px)`,
        transform: `translate(-50%, -50%) rotate(${point.rotation}deg)`,
      }}
    >
      <Link
        href={`/?b=${bouquet.slug}`}
        aria-label={`Open bouquet ${bouquet.slug}`}
        className="absolute inset-0 block overflow-hidden border border-black/[0.12] bg-white shadow-[0_5px_16px_rgba(0,0,0,0.07)] transition-[box-shadow,filter] duration-200 group-hover:z-50 group-hover:shadow-[0_9px_26px_rgba(0,0,0,0.16)] focus-visible:z-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
      >
        <img
          src={bouquet.image_url || "/flowers.png"}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {bouquet.items?.map((item) => (
          <div
            key={item.id}
            className="absolute z-10"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${Math.max(0.35, item.scale * 0.52)})`,
            }}
          >
            <MiniLink item={item} />
          </div>
        ))}
      </Link>
    </div>
  );
}

export default function GalleryClient() {
  const [bouquets, setBouquets] = useState<PublicBouquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 0.32 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; camera: Camera } | null>(null);

  useEffect(() => {
    loadAllBouquets().then((result) => {
      if ("error" in result) setError(result.error);
      else setBouquets(result);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;
    const updateViewport = () => {
      const rect = element.getBoundingClientRect();
      setViewport({ width: rect.width, height: rect.height });
    };
    updateViewport();
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setViewport({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    window.addEventListener("resize", updateViewport);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  const points = useMemo(
    () => bouquets.map((_, index) => flowerPosition(index, bouquets.length)),
    [bouquets],
  );

  const visible = useMemo(() => {
    if (!viewport.width || !viewport.height) return [];
    const padding = 180 / camera.zoom;
    const halfWidth = viewport.width / 2 / camera.zoom + padding;
    const halfHeight = viewport.height / 2 / camera.zoom + padding;
    return bouquets
      .map((bouquet, index) => ({ bouquet, point: points[index], index }))
      .filter(({ point }) =>
        point.x > -halfWidth - camera.x &&
        point.x < halfWidth - camera.x &&
        point.y > -halfHeight - camera.y &&
        point.y < halfHeight - camera.y,
      );
  }, [bouquets, camera, points, viewport]);

  const renderedBouquets = viewport.width > 0 && viewport.height > 0
    ? visible
    : bouquets.slice(0, Math.min(120, bouquets.length)).map((bouquet, index) => ({
        bouquet,
        point: points[index],
        index,
      }));

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setCamera({
      ...drag.camera,
      x: drag.camera.x + (event.clientX - drag.x) / drag.camera.zoom,
      y: drag.camera.y + (event.clientY - drag.y) / drag.camera.zoom,
    });
  };

  const stopDragging = () => {
    dragRef.current = null;
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const cursorX = event.clientX - rect.left - rect.width / 2;
    const cursorY = event.clientY - rect.top - rect.height / 2;
    const nextZoom = Math.min(2.4, Math.max(0.16, camera.zoom * Math.exp(-event.deltaY * 0.001)));
    const ratio = 1 - nextZoom / camera.zoom;
    setCamera({
      zoom: nextZoom,
      x: camera.x + (cursorX / camera.zoom) * ratio,
      y: camera.y + (cursorY / camera.zoom) * ratio,
    });
  };

  if (loading) return <LoadingFallback />;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-white text-black">
      <div
        ref={canvasRef}
        className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onWheel={handleWheel}
      >
        <div
          className="absolute inset-0 origin-center"
          style={{ transform: `translate(${camera.x * camera.zoom}px, ${camera.y * camera.zoom}px) scale(${camera.zoom})` }}
        >
          <div className="pointer-events-none absolute left-1/2 top-[calc(50%+42px)] z-0 h-[1500px] w-[3px] -translate-x-1/2 bg-[#dfe7dc]/70 shadow-[0_0_8px_rgba(80,100,70,0.08)]" />
          <div className="pointer-events-none absolute left-[calc(50%-72px)] top-[calc(50%+430px)] z-0 h-8 w-36 -rotate-[24deg] border-t-2 border-[#dfe7dc]/70" style={{ borderRadius: "50% 0 0 0" }} />
          <div className="pointer-events-none absolute left-[calc(50%-64px)] top-[calc(50%+690px)] z-0 h-8 w-32 rotate-[26deg] border-t-2 border-[#dfe7dc]/70" style={{ borderRadius: "0 50% 0 0" }} />
          {renderedBouquets.map(({ bouquet, point, index }) => (
            <PreviewTile key={`${bouquet.slug}-${index}`} bouquet={bouquet} point={point} />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute left-5 top-5 z-10 flex items-center gap-3 text-[11px] tracking-[0.16em] text-black/45 uppercase">
        <Link href="/" className="pointer-events-auto text-black/70 transition-colors hover:text-black">
          Link Bouquet
        </Link>
        <span aria-hidden="true">·</span>
        <span>{error ? "Unable to load bouquets" : `${bouquets.length.toLocaleString()} bouquets`}</span>
      </div>
    </main>
  );
}
