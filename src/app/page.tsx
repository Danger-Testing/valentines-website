"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { saveBouquet, loadBouquet, type MediaItem, type MediaType } from "@/lib/supabase";
import { cecilia } from "./fonts";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      <p className="text-black font-medium">Loading...</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Home />
    </Suspense>
  );
}

// Precurated media items for the sidebar
const CURATED_MEDIA = [
  { type: 'youtube' as MediaType, mediaId: 'dQw4w9WgXcQ', label: 'Classic Love Song' },
  { type: 'youtube' as MediaType, mediaId: 'JGwWNGJdvx8', label: 'Ed Sheeran' },
  { type: 'spotify' as MediaType, mediaId: 'track/4uLU6hMCjMI75M1A2tKUQC', label: 'Never Gonna Give You Up' },
  { type: 'spotify' as MediaType, mediaId: 'track/3d9DChrdc6BOeFsbrZ3Is0', label: 'Cant Help Falling' },
  { type: 'spotify' as MediaType, mediaId: 'playlist/37i9dQZF1DX50QitC6Oqtn', label: 'Love Songs Playlist' },
  { type: 'substack' as MediaType, mediaId: 'https://www.henrikkarlsson.xyz/p/looking-for-alice', label: 'Looking for Alice' },
];

// Substack thumbnail component that fetches OG image
function SubstackThumbnail({ url, isModal }: { url: string; isModal: boolean }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');

  useEffect(() => {
    const slug = url.split('/p/')[1]?.replace(/\?.*$/, '');
    setTitle(slug?.replace(/-/g, ' ') || 'Substack Article');

    fetch(`/api/og?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
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
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-[200px] h-[140px] rounded-xl overflow-hidden shadow-lg bg-white hover:shadow-xl transition-shadow"
      onClick={(e) => e.stopPropagation()}
    >
      {thumbnail ? (
        <div className="w-full h-full relative">
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
              </svg>
              <span className="text-[10px] text-white font-medium truncate">{title}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-3 flex flex-col justify-center items-center">
          <svg className="w-10 h-10 text-gray-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
          </svg>
          <span className="text-xs text-gray-600 font-medium text-center line-clamp-2">{title}</span>
        </div>
      )}
    </a>
  );
}

function Home() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModal, setShowModal] = useState<MediaItem | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [rotating, setRotating] = useState<string | null>(null);
  const [scaling, setScaling] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotateStart, setRotateStart] = useState({ angle: 0, itemRotation: 0 });
  const [scaleStart, setScaleStart] = useState({ distance: 0, itemScale: 1 });

  // Supabase sharing state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewingShared, setIsViewingShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flowerImage, setFlowerImage] = useState<'flowers' | 'flowers2'>('flowers');
  const [bgColor, setBgColor] = useState('#ffffff');

  const canvasRef = useRef<HTMLDivElement>(null);

  // Load bouquet from URL if slug parameter exists
  useEffect(() => {
    const slug = searchParams.get('b');
    if (slug) {
      setIsLoading(true);
      loadBouquet(slug).then((result) => {
        if ('error' in result) {
          alert('Could not load bouquet: ' + result.error);
          setIsLoading(false);
          return;
        }
        setItems(result.items);
        setIsViewingShared(true);
        setIsLoading(false);
      });
    }
  }, [searchParams]);

  // Handle saving bouquet to Supabase
  const handleSave = async () => {
    if (isSaving || items.length === 0) return;
    setIsSaving(true);

    const result = await saveBouquet({
      image_url: `/${flowerImage}.png`,
      paths: [],
      items: items,
    });

    if ('error' in result) {
      alert('Could not save bouquet: ' + result.error);
      setIsSaving(false);
      return;
    }

    const url = `${window.location.origin}?b=${result.slug}`;
    setShareUrl(url);
    setIsSaving(false);
  };

  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // URL parsing
  const parseUrl = (url: string): { type: MediaType; id: string } | null => {
    const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (igMatch) return { type: 'instagram', id: igMatch[1] };

    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (ytMatch) return { type: 'youtube', id: ytMatch[1] };

    const spotifyMatch = url.match(/spotify\.com\/(track|album|playlist)\/([A-Za-z0-9]+)/);
    if (spotifyMatch) return { type: 'spotify', id: `${spotifyMatch[1]}/${spotifyMatch[2]}` };

    const substackMatch = url.match(/(?:([a-zA-Z0-9-]+)\.substack\.com|www\.([a-zA-Z0-9-]+)\.[a-z]+)\/p\/([a-zA-Z0-9-]+)/);
    if (substackMatch) return { type: 'substack', id: url };

    return null;
  };

  const addItem = (type: MediaType, mediaId: string) => {
    const newItem: MediaItem = {
      id: crypto.randomUUID(),
      type,
      mediaId,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      rotation: 0,
      scale: 0.8,
    };
    setItems([...items, newItem]);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parseUrl(text);
      if (parsed) {
        addItem(parsed.type, parsed.id);
      } else {
        setShowInput(true);
      }
    } catch {
      setShowInput(true);
    }
  };

  const handleInputSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get("url") as string;
    const parsed = parseUrl(url);
    if (parsed) {
      addItem(parsed.type, parsed.id);
      setShowInput(false);
    } else {
      alert("Please enter a valid Instagram, YouTube, or Spotify URL");
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, itemId: string) => {
    if (canvasRef.current) {
      const item = items.find(i => i.id === itemId);
      if (item) {
        const rect = canvasRef.current.getBoundingClientRect();
        const itemX = (item.x / 100) * rect.width;
        const itemY = (item.y / 100) * rect.height;
        setDragOffset({
          x: e.clientX - rect.left - itemX,
          y: e.clientY - rect.top - itemY,
        });
        setDragging(itemId);
        setHasDragged(false);
      }
    }
  }, [items]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging && canvasRef.current) {
      setHasDragged(true);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

      setItems(items.map(item =>
        item.id === dragging
          ? { ...item, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
          : item
      ));
    }

    if (rotating && canvasRef.current) {
      const item = items.find(i => i.id === rotating);
      if (item) {
        const rect = canvasRef.current.getBoundingClientRect();
        const centerX = rect.left + (item.x / 100) * rect.width;
        const centerY = rect.top + (item.y / 100) * rect.height;
        const currentAngle = Math.atan2(e.clientX - centerX, centerY - e.clientY) * (180 / Math.PI);
        const angleDelta = currentAngle - rotateStart.angle;
        const newRotation = rotateStart.itemRotation + angleDelta;

        setItems(items.map(i =>
          i.id === rotating ? { ...i, rotation: newRotation } : i
        ));
      }
    }

    if (scaling && canvasRef.current) {
      const item = items.find(i => i.id === scaling);
      if (item) {
        const rect = canvasRef.current.getBoundingClientRect();
        const centerX = rect.left + (item.x / 100) * rect.width;
        const centerY = rect.top + (item.y / 100) * rect.height;
        const currentDistance = Math.sqrt(
          Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
        );
        const scaleFactor = currentDistance / scaleStart.distance;
        const newScale = Math.max(0.3, Math.min(3, scaleStart.itemScale * scaleFactor));

        setItems(items.map(i =>
          i.id === scaling ? { ...i, scale: newScale } : i
        ));
      }
    }
  }, [dragging, rotating, scaling, dragOffset, rotateStart, scaleStart, items]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setRotating(null);
    setScaling(null);
  }, []);

  const deleteItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  // Arrange items in a nice pattern around the bouquet
  const arrangeItems = () => {
    if (items.length === 0) return;

    const positions = [
      { x: 15, y: 25 },
      { x: 85, y: 25 },
      { x: 10, y: 55 },
      { x: 90, y: 55 },
      { x: 20, y: 80 },
      { x: 80, y: 80 },
      { x: 50, y: 15 },
      { x: 50, y: 85 },
    ];

    const arranged = items.map((item, index) => {
      const pos = positions[index % positions.length];
      return {
        ...item,
        x: pos.x,
        y: pos.y,
        rotation: 0,
        scale: 0.7,
      };
    });

    setItems(arranged);
  };

  const renderEmbed = (item: MediaItem, isModal: boolean = false) => {
    if (item.type === 'instagram') {
      if (isModal) {
        return (
          <div className="w-[400px] h-[780px] overflow-hidden">
            <iframe
              src={`https://www.instagram.com/reel/${item.mediaId}/embed`}
              width="540"
              height="1000"
              className="border-0"
              style={{ marginLeft: '-70px', marginTop: '-55px' }}
              allowFullScreen
            />
          </div>
        );
      }
      return (
        <div className="overflow-hidden w-[180px] h-[320px] rounded-xl shadow-lg bg-white">
          <iframe
            src={`https://www.instagram.com/reel/${item.mediaId}/embed`}
            width="300"
            height="500"
            className="border-0 pointer-events-none"
            style={{ marginLeft: '-60px', marginTop: '-45px' }}
            scrolling="no"
          />
        </div>
      );
    }

    if (item.type === 'youtube') {
      if (isModal) {
        return (
          <iframe
            src={`https://www.youtube.com/embed/${item.mediaId}?autoplay=1`}
            width="560"
            height="315"
            className="border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
      return (
        <div className="w-[280px] h-[158px] bg-black rounded-xl overflow-hidden shadow-lg">
          <iframe
            src={`https://www.youtube.com/embed/${item.mediaId}`}
            width="280"
            height="158"
            className="border-0 pointer-events-none"
            scrolling="no"
          />
        </div>
      );
    }

    if (item.type === 'spotify') {
      const embedUrl = `https://open.spotify.com/embed/${item.mediaId}?utm_source=generator&theme=0`;
      if (isModal) {
        return (
          <iframe
            src={embedUrl}
            width="400"
            height="352"
            className="border-0 rounded-xl"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
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

    if (item.type === 'substack') {
      return <SubstackThumbnail url={item.mediaId} isModal={isModal} />;
    }

    return null;
  };

  // Loading state
  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas area */}
      <div ref={canvasRef} className="absolute inset-0">
        {/* Flowers background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={`/${flowerImage}.png`}
            alt="Flower bouquet"
            width={900}
            height={1200}
            className="object-contain max-h-[95vh] pointer-events-none"
            priority
          />
        </div>

        {/* Media items */}
        {items.map((item) => (
          <div
            key={item.id}
            className={`absolute transition-shadow ${
              !isViewingShared && dragging === item.id
                ? 'cursor-grabbing z-30'
                : !isViewingShared
                  ? 'cursor-grab z-20 hover:z-30'
                  : 'z-20'
            }`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
            }}
            onMouseDown={(e) => {
              if (isViewingShared) return;
              e.preventDefault();
              handleMouseDown(e, item.id);
            }}
          >
            <div className="relative group">
              <div
                onClick={() => !hasDragged && setShowModal(item)}
                className="cursor-pointer"
              >
                {renderEmbed(item)}
              </div>
              {!isViewingShared && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#E6E6E6]/50 backdrop-blur-md border-2 border-[#EAEAEA] hover:bg-white/90 text-black flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* Scale handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (canvasRef.current) {
                        const rect = canvasRef.current.getBoundingClientRect();
                        const centerX = rect.left + (item.x / 100) * rect.width;
                        const centerY = rect.top + (item.y / 100) * rect.height;
                        const startDistance = Math.sqrt(
                          Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
                        );
                        setScaleStart({ distance: startDistance, itemScale: item.scale });
                      }
                      setScaling(item.id);
                    }}
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#E6E6E6]/50 backdrop-blur-md border-2 border-[#EAEAEA] hover:bg-white/90 text-black flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-nwse-resize"
                    title="Scale"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="fixed top-6 left-6 z-40">
        <span className={`text-2xl text-black ${cecilia.className}`}>Link Bouquet</span>
      </div>

      {/* Turtle top right */}
      <div className="fixed top-6 right-6 z-40">
        <a href="https://dangertesting.com" target="_blank" rel="noopener noreferrer">
          <Image src="/turtle.svg" alt="Turtle" width={80} height={80} />
        </a>
      </div>

      {/* Left Sidebar with curated media */}
      {!isViewingShared && (
        <div className={`fixed left-0 top-0 h-full z-30 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[280px]'}`}>
          <div className="w-[280px] h-full bg-[#E6E6E6]/50 backdrop-blur-md pt-20 pb-6 flex flex-col relative">
            {/* Appstar logo bottom left */}
            <div className="absolute bottom-4 left-4">
              <Image src="/appstar.png" alt="Appstar" width={120} height={120} className="w-auto h-24 rounded-xl" />
            </div>
            <div className="flex-1 overflow-y-auto px-4 space-y-3">
              {CURATED_MEDIA.map((media, index) => (
                <button
                  key={index}
                  onClick={() => addItem(media.type, media.mediaId)}
                  className="w-full p-3 bg-white hover:bg-white/90 border-2 border-[#EAEAEA] rounded-lg transition-colors text-left flex items-center gap-3"
                >
                  {media.type === 'youtube' && (
                    <div className="w-10 h-10 bg-[#FF0000] rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                  )}
                  {media.type === 'spotify' && (
                    <div className="w-10 h-10 bg-[#1DB954] rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                    </div>
                  )}
                  {media.type === 'substack' && (
                    <div className="w-10 h-10 bg-[#FF6719] rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
                      </svg>
                    </div>
                  )}
                  {media.type === 'instagram' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-black text-sm font-medium truncate block">{media.label}</span>
                    <span className="text-black/50 text-xs capitalize">{media.type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-1/2 -translate-y-1/2 -right-10 w-10 h-20 bg-[#E6E6E6]/50 backdrop-blur-md rounded-r-lg flex items-center justify-center text-black/50 hover:text-black transition-colors"
          >
            <svg className={`w-5 h-5 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Bottom toolbar - only show when editing */}
      {!isViewingShared && !shareUrl && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40 w-40">
          {/* Flower toggle button */}
          <button
            onClick={() => setFlowerImage(flowerImage === 'flowers' ? 'flowers2' : 'flowers')}
            className="w-full rounded-lg bg-white border-2 border-[#EAEAEA] transition-all overflow-hidden"
          >
            <Image
              src={`/${flowerImage === 'flowers' ? 'flowers2' : 'flowers'}.png`}
              alt="Switch flowers"
              width={160}
              height={200}
              className="w-full h-auto"
            />
          </button>

          {/* Background color picker */}
          <div className="relative h-12 w-full rounded-lg border-2 border-[#EAEAEA] overflow-hidden">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer"
            />
          </div>

          {/* Add link button */}
          <button
            onClick={handlePaste}
            className="h-12 w-full rounded-lg bg-[#E6E6E6]/50 backdrop-blur-md border-2 border-[#EAEAEA] transition-all flex items-center justify-center text-black hover:bg-white/90"
          >
            <span className="font-medium">Add Link</span>
          </button>

          {/* Arrange button */}
          {/* {items.length > 1 && (
            <button
              onClick={arrangeItems}
              className="h-12 w-full rounded-lg bg-[#E6E6E6]/50 backdrop-blur-md border-2 border-[#EAEAEA] transition-all flex items-center justify-center text-black hover:bg-white/90"
            >
              <span className="font-medium">Arrange</span>
            </button>
          )} */}

          {/* Save button */}
          {items.length > 0 && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="h-12 w-full rounded-lg bg-[#E6E6E6]/50 backdrop-blur-md border-2 border-[#EAEAEA] hover:bg-white/90 transition-all flex items-center justify-center text-black disabled:opacity-50"
            >
              <span className="font-medium">{isSaving ? 'Saving...' : 'Save & Share'}</span>
            </button>
          )}
        </div>
      )}

      {/* Share URL display */}
      {shareUrl && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-white rounded-xl shadow-xl p-5 flex flex-col gap-3 min-w-[320px]">
            <div className="flex items-center gap-2 text-black">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold text-lg">Saved!</span>
            </div>
            <p className="text-gray-600">Share this link with someone special:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 text-sm"
              />
              <button
                onClick={copyShareUrl}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  copied ? 'bg-gray-600 text-white' : 'bg-black hover:bg-gray-800 text-white'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => setShareUrl(null)}
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              Continue editing
            </button>
          </div>
        </div>
      )}

      {/* Create your own button - when viewing shared */}
      {isViewingShared && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => window.location.href = window.location.origin}
            className="h-12 px-6 rounded-lg bg-[#E6E6E6]/50 backdrop-blur-md border-2 border-[#EAEAEA] hover:bg-white/90 transition-all flex items-center gap-2 text-black"
          >
            <span className="font-medium">Create Your Own</span>
          </button>
        </div>
      )}

      {/* URL Input Modal */}
      {showInput && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleInputSubmit} className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Add a link</h2>
            <p className="text-gray-500 text-sm mb-4">Paste an Instagram, YouTube, or Spotify URL</p>
            <input
              type="text"
              name="url"
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-black focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowInput(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Full Screen Modal for viewing embeds */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(null)}
        >
          <div
            className="relative bg-black rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-2xl"
            >
              x
            </button>
            {renderEmbed(showModal, true)}
          </div>
        </div>
      )}
    </div>
  );
}
