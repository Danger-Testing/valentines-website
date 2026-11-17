"use client";

import {
  useState,
  useRef,
  useEffect,
  useEffectEvent,
  Suspense,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Check, Copy, X } from "lucide-react";
import {
  saveBouquet,
  loadBouquet,
  type MediaItem,
  type MediaType,
} from "@/lib/supabase";
import { MediaEmbed } from "@/components/embeds";
import { AddLinkDrawer } from "@/components/AddLinkDrawer";
import { fitToVisualViewport } from "@/lib/viewport";
import {
  LetterboxdIcon,
  LinkIcon,
  SpotifyIcon,
  SubstackIcon,
  YouTubeIcon,
} from "@/components/icons";
import { CURATED_BUCKETS } from "./curated";

type AppdropOutputVisibility = "private" | "unlisted" | "public";

type AppdropSaveOutput = {
  output_type: string;
  title: string;
  summary: string | null;
  source_url: string;
  visibility: AppdropOutputVisibility;
  data: Record<string, unknown>;
};

type AppdropSaveResponse = {
  output?: {
    id?: string;
  };
};

type AppdropCurrentOutputResponse = {
  href?: string;
};

const APPDROP_ORIGIN = "https://www.appdrop.com";

declare global {
  interface Window {
    appdrop?: {
      isEmbedded?: () => boolean;
      saveOutput?: (output: AppdropSaveOutput) => Promise<AppdropSaveResponse>;
      setCurrentOutput?: (output: {
        id: string;
      }) => Promise<AppdropCurrentOutputResponse>;
    };
  }
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      <p className="text-black font-medium">Loading...</p>
    </div>
  );
}

export default function HomeClient() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Home />
    </Suspense>
  );
}

function getBouquetTitle(fromName: string, toName: string) {
  const from = fromName.trim();
  const to = toName.trim();

  if (from && to) return `${from} + ${to}'s Link Bouquet`;
  if (from) return `${from}'s Link Bouquet`;
  if (to) return `Link Bouquet for ${to}`;
  return "Link Bouquet";
}

function getBouquetSummary(note: string, itemCount: number) {
  const trimmedNote = note.trim();
  return trimmedNote || `A bouquet with ${itemCount} ${itemCount === 1 ? "link" : "links"}.`;
}

function isRunningInAppdropFrame() {
  return (
    window.parent !== window &&
    typeof window.name === "string" &&
    window.name.startsWith("appdrop-world:")
  );
}

function getAppdropBouquetUrl(slug: string) {
  return `${APPDROP_ORIGIN}/b/${encodeURIComponent(slug)}`;
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function saveBouquetToAppdrop({
  bgColor,
  flowerImage,
  fromName,
  isGallery,
  items,
  note,
  slug,
  toName,
  url,
}: {
  bgColor: string;
  flowerImage: string;
  fromName: string;
  isGallery: boolean;
  items: MediaItem[];
  note: string;
  slug: string;
  toName: string;
  url: string;
}) {
  if (!window.appdrop?.isEmbedded?.() || !window.appdrop.saveOutput) return;

  const savedOutput = await window.appdrop.saveOutput({
    output_type: "link_bouquet",
    title: getBouquetTitle(fromName, toName),
    summary: getBouquetSummary(note, items.length),
    source_url: url,
    visibility: isGallery ? "public" : "private",
    data: {
      bg_color: bgColor,
      flowers: items.map((item) => ({
        mediaId: item.mediaId,
        rotation: item.rotation,
        scale: item.scale,
        type: item.type,
        x: item.x,
        y: item.y,
      })),
      from_name: fromName.trim() || null,
      image_url: `/${flowerImage}.png`,
      items,
      note: note.trim() || null,
      slug,
      to_name: toName.trim() || null,
      url,
    },
  });

  let shareUrl: string | undefined;
  const outputId = savedOutput.output?.id?.trim();
  if (outputId && window.appdrop.setCurrentOutput) {
    try {
      // Saving must finish first so Appdrop can stage the private chat card
      // before exposing the same result in the outer address bar. Give React
      // one paint to show that host card before the history handoff.
      await waitForNextPaint();
      const currentOutput = await window.appdrop.setCurrentOutput({
        id: outputId,
      });
      if (currentOutput.href) {
        shareUrl = new URL(currentOutput.href, APPDROP_ORIGIN).toString();
      }
    } catch (error) {
      console.info("appdrop: output URL handoff skipped", error);
    }
  }

  return { savedOutput, shareUrl };
}

const DEFAULT_NOTE = "Happy Valentine's Day!\nI love you like the internet!";

const FLOWER_OPTIONS = ["flowers", "flowers2", "5", "1", "2", "3", "4", "6", "7"] as const;
type FlowerOption = (typeof FLOWER_OPTIONS)[number];
// Cut-out flowers that sit at the bottom of the canvas instead of filling it
const TALL_FLOWERS: readonly FlowerOption[] = ["1", "2", "3", "4", "6", "7"];

const BG_PRESETS = [
  { color: "#F77196", title: "Pink background" },
  { color: "#C2021B", title: "Red background" },
];

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Sidebar tiles for curated media, by type
const MEDIA_ICONS: Partial<Record<MediaType, { bg: string; icon: ReactNode }>> = {
  youtube: {
    bg: "bg-[#FF0000]",
    icon: <YouTubeIcon className="w-5 h-5 text-white" />,
  },
  spotify: {
    bg: "bg-[#1DB954]",
    icon: <SpotifyIcon className="w-5 h-5 text-white" />,
  },
  substack: {
    bg: "bg-[#FF6719]",
    icon: <SubstackIcon className="w-5 h-5 text-white" />,
  },
  letterboxd: {
    bg: "bg-[#00e054]",
    icon: <LetterboxdIcon className="w-5 h-5 text-[#14181c]" />,
  },
  link: {
    bg: "bg-gray-500",
    icon: <LinkIcon className="w-5 h-5 text-white" />,
  },
};

function MediaTile({ type }: { type: MediaType }) {
  const tile = MEDIA_ICONS[type];
  if (!tile) return null;
  return (
    <div
      className={`w-10 h-10 ${tile.bg} rounded flex items-center justify-center flex-shrink-0`}
    >
      {tile.icon}
    </div>
  );
}

// Ids only have to be unique within a bouquet. crypto.randomUUID exists only
// on secure origins (https or localhost), so it is missing when the dev
// server is opened from a phone over the local network.
function createId() {
  return (
    crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

// Lets a finger drag an item on the canvas. Without these the browser claims
// the gesture for itself: a scroll or pull-to-refresh, a text selection, or
// the long-press menu on images. On touch screens the grab area also reaches
// past the item's edges, because items are drawn small on phones and a near
// miss lands on the flower, which opens the add-link sheet.
const TOUCH_DRAG =
  "touch-none select-none [-webkit-touch-callout:none] pointer-coarse:before:absolute pointer-coarse:before:-inset-8";

// Item positions are percentages of the canvas; keep centers inside it
const clampPercent = (value: number) => Math.max(5, Math.min(95, value));

function parseUrl(url: string): { type: MediaType; id: string } | null {
  const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  if (igMatch) return { type: "instagram", id: igMatch[1] };

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]+)/,
  );
  if (ytMatch) return { type: "youtube", id: ytMatch[1] };

  const spotifyMatch = url.match(
    /spotify\.com\/(track|album|playlist)\/([A-Za-z0-9]+)/,
  );
  if (spotifyMatch)
    return { type: "spotify", id: `${spotifyMatch[1]}/${spotifyMatch[2]}` };

  if (
    /(?:([a-zA-Z0-9-]+)\.substack\.com|www\.([a-zA-Z0-9-]+)\.[a-z]+)\/p\/([a-zA-Z0-9-]+)/.test(
      url,
    )
  )
    return { type: "substack", id: url };

  if (
    /letterboxd\.com\/(?:film\/([a-zA-Z0-9-]+)|([a-zA-Z0-9_]+)\/film\/([a-zA-Z0-9-]+))/.test(
      url,
    )
  )
    return { type: "letterboxd", id: url };

  const twitterMatch = url.match(
    /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)/,
  );
  if (twitterMatch) return { type: "twitter", id: twitterMatch[2] };

  // Fallback: any valid URL becomes a generic link
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return { type: "link", id: url };
    }
  } catch {
    // Invalid URL
  }

  return null;
}

function Home() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState(3);
  const [showModal, setShowModal] = useState<MediaItem | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [scaling, setScaling] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scaleStart, setScaleStart] = useState({ distance: 0, itemScale: 1 });

  // Supabase sharing state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isShareUrlCopied, setIsShareUrlCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewingShared, setIsViewingShared] = useState(false);
  const [flowerImage, setFlowerImage] = useState<FlowerOption>("flowers");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [fromName, setFromName] = useState("");
  const [toName, setToName] = useState("");
  const [isGallery, setIsGallery] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Show toast notification
  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsShareUrlCopied(true);

      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = setTimeout(() => {
        setIsShareUrlCopied(false);
      }, 2000);
    } catch {
      showToast("Could not copy the link. Please copy it manually.", "error");
    }
  };

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current) {
        clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  // Load bouquet from URL if slug parameter exists
  useEffect(() => {
    const slug = searchParams.get("b");
    if (!slug) return;
    const isEditMode = searchParams.get("edit") === "1";

    setIsLoading(true);
    loadBouquet(slug).then((result) => {
      setIsLoading(false);
      if ("error" in result) {
        showToast("Could not load bouquet: " + result.error, "error");
        return;
      }
      setItems(result.items);
      setBgColor(result.bg_color || "#ffffff");
      // Editing starts from the default note; the shared view shows only what
      // was saved
      setNote(result.note || (isEditMode ? DEFAULT_NOTE : ""));
      setFromName(result.from_name || "");
      setToName(result.to_name || "");
      setFlowerImage(
        FLOWER_OPTIONS.find((opt) => result.image_url === `/${opt}.png`) ||
          "flowers",
      );
      setIsViewingShared(!isEditMode);
    });
  }, [searchParams]);

  // Handle saving bouquet to Supabase
  const handleSave = async () => {
    if (isSaving || items.length === 0) return;
    setIsSaving(true);

    const result = await saveBouquet({
      image_url: `/${flowerImage}.png`,
      items,
      note: note.trim() ? note : null,
      bg_color: bgColor,
      from_name: fromName.trim() ? fromName : null,
      to_name: toName.trim() ? toName : null,
      is_gallery: isGallery,
    });

    if ("error" in result) {
      showToast("Could not save bouquet: " + result.error, "error");
      setIsSaving(false);
      return;
    }

    const url = `${window.location.origin}?b=${result.slug}`;
    // The frame marker is owned by Appdrop and is available independently of
    // SDK timing. Never replace the iframe while its host is preparing chat.
    const isAppdropEmbedded = isRunningInAppdropFrame();
    const appdropResult = await saveBouquetToAppdrop({
      bgColor,
      flowerImage,
      fromName,
      isGallery,
      items,
      note,
      slug: result.slug,
      toName,
      url,
    }).catch((error) => {
      console.info("appdrop: bouquet output save skipped", error);
    });

    setShareUrl(
      isAppdropEmbedded
        ? appdropResult?.shareUrl ?? getAppdropBouquetUrl(result.slug)
        : url,
    );
    setIsShareUrlCopied(false);
    setShowNoteModal(false);
    setIsSaving(false);

    if (!isAppdropEmbedded) {
      window.location.href = `?b=${result.slug}`;
    }
  };

  // Add an item at the given canvas position, or somewhere near the middle
  const addItem = (
    type: MediaType,
    mediaId: string,
    position?: { x: number; y: number },
  ) => {
    const newItem: MediaItem = {
      id: createId(),
      type,
      mediaId,
      x: position ? clampPercent(position.x) : 30 + Math.random() * 40,
      y: position ? clampPercent(position.y) : 30 + Math.random() * 40,
      rotation: 0,
      scale: 0.8,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id: string, patch: Partial<MediaItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Adds the link on the clipboard, if it holds one
  const addFromClipboard = async () => {
    try {
      const parsed = parseUrl(await navigator.clipboard.readText());
      if (!parsed) return false;
      addItem(parsed.type, parsed.id);
      return true;
    } catch {
      // Clipboard access denied
      return false;
    }
  };

  const handlePaste = async () => {
    if (!(await addFromClipboard())) setShowInput(true);
  };

  const handleUrlSubmit = (url: string) => {
    const parsed = parseUrl(url);
    if (parsed) {
      addItem(parsed.type, parsed.id);
      setShowInput(false);
    } else {
      showToast(
        "Please enter a valid Instagram, YouTube, or Spotify URL",
        "error",
      );
    }
  };

  // Pointer position relative to an item's center, in pixels
  const offsetFromItem = (item: MediaItem, clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: clientX - rect.left - (item.x / 100) * rect.width,
      y: clientY - rect.top - (item.y / 100) * rect.height,
    };
  };

  // Dragging and scaling, shared by the mouse and touch handlers
  const startDrag = (item: MediaItem, clientX: number, clientY: number) => {
    const offset = offsetFromItem(item, clientX, clientY);
    if (!offset) return;
    setDragOffset(offset);
    setDragging(item.id);
    setHasDragged(false);
  };

  const startScale = (item: MediaItem, clientX: number, clientY: number) => {
    const offset = offsetFromItem(item, clientX, clientY);
    if (offset) {
      setScaleStart({
        distance: Math.hypot(offset.x, offset.y),
        itemScale: item.scale,
      });
    }
    setScaling(item.id);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (dragging) {
      setHasDragged(true);
      updateItem(dragging, {
        x: clampPercent(((clientX - rect.left - dragOffset.x) / rect.width) * 100),
        y: clampPercent(((clientY - rect.top - dragOffset.y) / rect.height) * 100),
      });
    }

    const scaledItem = scaling && items.find((item) => item.id === scaling);
    const offset = scaledItem && offsetFromItem(scaledItem, clientX, clientY);
    if (offset) {
      const scaleFactor = Math.hypot(offset.x, offset.y) / scaleStart.distance;
      updateItem(scaledItem.id, {
        scale: Math.max(0.3, Math.min(3, scaleStart.itemScale * scaleFactor)),
      });
    }
  };

  const stopInteraction = () => {
    setDragging(null);
    setScaling(null);
  };

  // Calculate canvas scale based on actual rendered size vs reference size (900px)
  // Using ResizeObserver for reliable size tracking. A floor keeps embeds
  // tappable on phones, where the canvas is well under half the reference width.
  useEffect(() => {
    const updateCanvasScale = () => {
      if (canvasRef.current) {
        const width = canvasRef.current.offsetWidth;
        setCanvasScale(Math.max(0.5, width / 900));
      }
    };

    updateCanvasScale();

    // ResizeObserver is more reliable than window resize for element size changes
    const observer = new ResizeObserver(updateCanvasScale);
    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Listen for Cmd+V / Ctrl+V to paste link directly and ESC to close dialogs
  const handleKeyDown = useEffectEvent(async (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowModal(null);
      setShowInput(false);
      setShowNoteModal(false);
      return;
    }

    if (
      (e.metaKey || e.ctrlKey) &&
      e.key === "v" &&
      !isViewingShared &&
      !showInput
    ) {
      if (await addFromClipboard()) e.preventDefault();
    }
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  // Focus trap for modals
  useEffect(() => {
    const isModalOpen = showModal || showInput || showNoteModal;
    if (!isModalOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return;

      const focusable = modal.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    // Focus first focusable element in modal
    setTimeout(() => {
      document
        .querySelector('[role="dialog"]')
        ?.querySelector<HTMLElement>(FOCUSABLE)
        ?.focus();
    }, 100);

    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [showModal, showInput, showNoteModal]);

  const renderEmbed = (item: MediaItem, isModal: boolean = false) => (
    <MediaEmbed
      type={item.type}
      mediaId={item.mediaId}
      isModal={isModal}
      // On the canvas, thumbnail embeds open their link unless it was a drag
      onLinkClick={
        isModal
          ? undefined
          : (e) => {
              e.stopPropagation();
              if (!hasDragged) {
                window.open(item.mediaId, "_blank", "noopener,noreferrer");
              }
            }
      }
    />
  );

  // Loading state
  if (isLoading) {
    return <LoadingFallback />;
  }

  const isTallFlower = TALL_FLOWERS.includes(flowerImage);
  const curator = CURATED_BUCKETS[selectedBucket];

  return (
    <div
      className="h-dvh min-h-dvh relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
      onMouseUp={stopInteraction}
      onMouseLeave={stopInteraction}
      onTouchMove={(e) => {
        if (e.touches.length === 1) {
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={stopInteraction}
      onTouchCancel={stopInteraction}
    >
      {/* Full page background for 5.png */}
      {flowerImage === "5" && (
        <div className="absolute inset-0 z-0 bg-black">
          <Image
            src="/5.png"
            alt="Flower background"
            fill
            className="object-contain select-none"
            draggable={false}
            priority
          />
        </div>
      )}
      {/* Canvas area - centered, always maintains 3:4 aspect ratio */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-2 sm:p-4">
        <div
          ref={canvasRef}
          className="relative w-full max-w-[900px] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)]"
          style={{
            aspectRatio: "3/4",
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const data = e.dataTransfer.getData("application/json");
            if (data && canvasRef.current) {
              const { type, mediaId } = JSON.parse(data);
              const rect = canvasRef.current.getBoundingClientRect();
              addItem(type, mediaId, {
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              });
            }
          }}
        >
          {/* Flowers background */}
          {flowerImage !== "5" && (
          <div className={`absolute inset-x-[8%] md:inset-x-0 ${isTallFlower ? "-bottom-[2%] -top-[50%]" : "-bottom-[40%] -top-[10%]"}`}>
            <Image
              src={`/${flowerImage}.png`}
              alt="Flower bouquet"
              fill
              className={`${isTallFlower ? "object-contain object-bottom" : "object-contain"} select-none`}
              draggable={false}
              priority
            />
            {/* Clickable area on flower to paste link or open drawer */}
            {!isViewingShared && (
              <button
                onClick={handlePaste}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 cursor-pointer z-10"
                aria-label="Add link"
              />
            )}
          </div>
          )}

          {/* Empty state prompt */}
          {!isViewingShared && items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-4 sm:px-8 sm:py-6 mx-4 text-left max-w-sm shadow-lg">
                <p className="text-black/80 text-fluid-lg font-medium mb-3">
                  Start curating your bouquet
                </p>
                <p className="text-black/60 text-fluid-sm mb-3">
                  Paste a link with{" "}
                  <kbd className="px-1.5 py-0.5 bg-black/10 rounded text-xs font-mono">
                    ⌘V
                  </kbd>
                  <br />
                  or tap Add Link to begin.
                </p>
                <p className="text-black/60 text-fluid-sm">
                  When it's ready, click Save & Share
                  <br />
                  and surprise someone.
                </p>
              </div>
            </div>
          )}

          {/* Media items - scaled based on canvas size */}
          {items.map((item) => (
            <div
              key={item.id}
              className={`absolute transition-shadow ${
                isViewingShared
                  ? "z-20"
                  : `${TOUCH_DRAG} ${
                      dragging === item.id
                        ? "cursor-grabbing z-30"
                        : "cursor-grab z-20 hover:z-30"
                    }`
              }`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale * canvasScale})`,
              }}
              onMouseDown={(e) => {
                if (isViewingShared) return;
                e.preventDefault();
                startDrag(item, e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                if (isViewingShared || e.touches.length !== 1) return;
                startDrag(item, e.touches[0].clientX, e.touches[0].clientY);
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
                      aria-label="Remove item"
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#E6E6E6]/50 backdrop-blur-md border-2 border-[#EAEAEA] hover:bg-white/90 text-black flex items-center justify-center shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-black/30"
                      title="Remove"
                    >
                      <X aria-hidden="true" className="w-4 h-4" />
                    </button>
                    {/* Scale handle - hidden on mobile */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        startScale(item, e.clientX, e.clientY);
                      }}
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#E6E6E6]/50 backdrop-blur-md border-2 border-[#EAEAEA] hover:bg-white/90 text-black flex items-center justify-center shadow-lg hidden md:flex md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-nwse-resize"
                      title="Scale"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                        />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <a href="/" className="fixed top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 z-20 cursor-pointer">
        <Image
          src="/logo.png"
          alt="Link Bouquet"
          width={500}
          height={400}
          className="h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56 w-auto"
          style={flowerImage === "5" ? { filter: "brightness(0) saturate(100%) invert(24%) sepia(95%) saturate(4000%) hue-rotate(355deg) brightness(97%) contrast(95%)" } : undefined}
        />
      </a>

      {/* Decorative link image */}
      <div className="fixed bottom-0 left-0 z-40 hidden md:block">
        <Image
          src="/link.png"
          alt=""
          width={400}
          height={400}
          className="w-36 h-36 object-contain"
        />
      </div>

      {/* Decorative turtle */}
      <div className="pointer-events-none fixed top-4 right-4 md:top-6 md:right-6 z-40">
        <Image
          src="/turtle.png"
          alt="Turtle"
          width={150}
          height={150}
          className="w-12 h-12 md:w-20 md:h-20"
        />
      </div>

      {/* Note display bottom right - only on sharing page */}
      {isViewingShared && (note || fromName || toName) && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 max-w-[calc(100vw-2rem)] sm:max-w-xs md:max-w-sm">
          <div className="bg-[#E6E6E6]/50 backdrop-blur-md rounded-xl p-4">
            {(fromName || toName) && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-black text-sm font-normal">{fromName || "?"}</span>
                <span className="text-black/50 text-sm">+</span>
                <span className="text-black text-sm font-normal">{toName || "?"}</span>
              </div>
            )}
            {note && (
              <p className="text-black text-sm whitespace-pre-wrap">{note}</p>
            )}
          </div>
        </div>
      )}

      {/* Left Sidebar with curated media */}
      {!isViewingShared && (
        <>
        {/* Mobile backdrop: tap outside to close the drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <div
          className={`fixed left-0 top-1/2 -translate-y-1/2 z-30 w-[min(280px,85vw)] transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="w-full bg-[#E6E6E6]/50 backdrop-blur-md rounded-r-2xl py-4 flex flex-col relative">
            {/* Profile pictures rows */}
            <div className="px-4 pb-2">
              {/* Five 40px avatars per row, spread across the full width */}
              <div className="grid grid-cols-5 gap-x-[calc((100%-200px)/4)] gap-y-2">
                {CURATED_BUCKETS.map((bucket, i) => (
                  <button
                    key={bucket.name}
                    onClick={() => setSelectedBucket(i)}
                    className={`rounded-full transition-all ${selectedBucket === i ? "scale-110" : "opacity-60 hover:opacity-100"}`}
                  >
                    <Image
                      src={bucket.pfp}
                      alt={bucket.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
            {/* Media items for selected bucket */}
            <div className="px-4 pt-2 flex flex-col space-y-2 max-h-[min(460px,calc(100dvh-14rem))] overflow-y-auto overscroll-contain">
              {curator.media.map((media, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "application/json",
                      JSON.stringify({
                        type: media.type,
                        mediaId: media.mediaId,
                      }),
                    );
                  }}
                  onClick={() => {
                    addItem(media.type, media.mediaId);
                    setSidebarOpen(false);
                  }}
                  className="w-full p-3 bg-white hover:bg-white/90 rounded-lg transition-colors text-left flex items-center gap-3 cursor-grab active:cursor-grabbing"
                >
                  <MediaTile type={media.type} />
                  <div className="flex-1 min-w-0">
                    <span className="text-black text-sm font-medium truncate block">
                      {media.label}
                    </span>
                    <span className="text-black/50 text-xs capitalize">
                      {media.type}
                    </span>
                  </div>
                </div>
              ))}
              {curator.media.length === 0 && (
                <p className="text-black/50 text-sm text-center py-4">No links yet</p>
              )}
              {curator.media.length > 0 && (
                <p className="text-black/50 text-xs text-center pt-4 italic">
                  Curated by{" "}
                  <a
                    href={curator.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {curator.name}
                  </a>
                </p>
              )}
            </div>
          </div>
          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarOpen}
            className="absolute top-1/2 -translate-y-1/2 -right-10 w-10 h-20 bg-[#E6E6E6]/50 backdrop-blur-md rounded-r-lg flex items-center justify-center text-black/50 hover:text-black transition-colors focus:outline-none"
          >
            <svg
              className={`w-5 h-5 transition-transform ${sidebarOpen ? "" : "rotate-180"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
        </>
      )}

      {/* Bottom toolbar - only show when editing */}
      {!isViewingShared && !shareUrl && (
        // The bar spans the screen on phones; only its two groups take touches,
        // so items lying in the gap between them can still be grabbed
        <div className="pointer-events-none fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-4 right-4 md:left-auto md:right-6 flex justify-between md:justify-start gap-3 z-40 md:flex-col md:w-40">
          {/* Left column on mobile / Top on desktop: Flower toggle + colors */}
          <div className="pointer-events-auto flex flex-col gap-2 items-center justify-end md:justify-start">
            {/* Flower grid selector */}
            <div className="grid grid-cols-3 gap-1.5 md:gap-2">
              {FLOWER_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setFlowerImage(option)}
                  className={`w-7 h-7 md:w-10 md:h-10 rounded-lg overflow-hidden cursor-pointer transition-all ${flowerImage === option ? "ring-2 ring-white scale-110" : "bg-[#E6E6E6]/50 backdrop-blur-md hover:scale-110"}`}
                >
                  <Image
                    src={`/${option}.png`}
                    alt={`Flower ${option}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Background color picker squares */}
            <div className="flex justify-center gap-2 md:gap-3 md:py-2">
              {BG_PRESETS.map(({ color, title }) => (
                <button
                  key={color}
                  onClick={() => setBgColor(color)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#E6E6E6]/50 backdrop-blur-md hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
                  title={title}
                >
                  <div
                    className="w-5 h-5 md:w-6 md:h-6 rounded"
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
              {/* Custom color picker square */}
              <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#E6E6E6]/50 backdrop-blur-md hover:scale-110 transition-transform cursor-pointer flex items-center justify-center">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="absolute inset-0 w-full h-full rounded-lg cursor-pointer opacity-0"
                  title="Custom color"
                />
                <div
                  className="w-5 h-5 md:w-6 md:h-6 rounded pointer-events-none"
                  style={{
                    background: `conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right column on mobile / Bottom on desktop: Add Link + Save & Share */}
          <div className="pointer-events-auto flex flex-col gap-2 md:gap-3 w-28 md:w-full md:flex-none justify-end md:justify-start">
            {/* Add link button */}
            <button
              onClick={() => setShowInput(true)}
              aria-label="Add a link to your bouquet"
              className="h-12 w-full rounded-lg bg-[#E6E6E6]/50 backdrop-blur-md transition-all flex items-center justify-center text-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/30"
            >
              <span className="font-medium text-sm md:text-base">Add Link</span>
            </button>

            {/* Save button */}
            <button
              onClick={() => setShowNoteModal(true)}
              disabled={items.length === 0}
              aria-label="Save and share your bouquet"
              className="h-12 w-full rounded-lg bg-[#DB234F] hover:bg-[#B81D42] transition-all flex items-center justify-center text-white disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#DB234F]/50"
            >
              <span className="font-medium text-sm md:text-base">
                Save & Share ⚘
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Note Modal for Save */}
      {showNoteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-modal-title"
          className="fixed inset-0 bg-black/10 backdrop-blur-md z-50 touch-none"
          onClick={() => setShowNoteModal(false)}
        >
          {/* The card is placed within what the keyboard leaves visible, while
              the backdrop above keeps covering the whole screen. On touch
              screens the card sits at the top, so it is already clear of the
              keyboard and stays put when a field is focused. */}
          <div
            ref={fitToVisualViewport}
            className="absolute inset-x-0 top-0 h-full flex items-start pointer-fine:items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]"
          >
            <div
              className="bg-white/50 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-xl max-w-md w-full max-h-full overflow-y-auto overscroll-contain touch-pan-y"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="save-modal-title" className="sr-only">
                Add a note to your bouquet
              </h2>
              {/* From / To row. Fields are 16px so iOS does not zoom the page
                  when one is focused */}
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="From"
                  className="flex-1 min-w-0 px-4 py-3 rounded-lg border-none bg-black/10 focus:outline-none font-normal text-base"
                />
                <input
                  type="text"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  placeholder="To"
                  className="flex-1 min-w-0 px-4 py-3 rounded-lg border-none bg-black/10 focus:outline-none font-normal text-base"
                />
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={DEFAULT_NOTE}
                className="w-full px-4 py-3 rounded-xl border-none focus:outline-none mb-4 resize-none h-36 bg-transparent text-base"
                autoFocus
              />
              <label className="flex items-center gap-3 mb-4 cursor-pointer group">
                <div className="relative w-12 h-7 rounded-full bg-black/10 transition-colors duration-200 ease-in-out peer-focus:ring-2 peer-focus:ring-[#DB234F]/50"
                  style={{ backgroundColor: isGallery ? '#DB234F' : 'rgba(0,0,0,0.1)' }}>
                  <div
                    className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out"
                    style={{ transform: isGallery ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </div>
                <input
                  type="checkbox"
                  checked={isGallery}
                  onChange={(e) => setIsGallery(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="text-black/70 text-sm">Show in gallery</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 px-4 py-3 bg-[#E6E6E6]/50 backdrop-blur-md text-black rounded-lg transition-colors font-medium cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-[#DB234F] backdrop-blur-md text-white rounded-lg transition-colors font-medium disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save & Share ⚘"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved/share dialog for the embedded AppDrop experience */}
      {shareUrl && !isViewingShared && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 p-4 backdrop-blur-md"
          onClick={() => setShareUrl(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white/90 p-5 sm:p-6 shadow-xl backdrop-blur-xl max-h-[calc(100dvh-2rem)] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#DB234F] text-white">
                  <Check aria-hidden="true" className="h-5 w-5" />
                </div>
                <h2
                  id="share-modal-title"
                  className="text-xl font-medium text-black"
                >
                  Saved and ready to share in chat
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShareUrl(null)}
                aria-label="Close share dialog"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-xl text-black/60 transition-colors hover:bg-black/10 hover:text-black focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-black/60">
              Copy your bouquet link to share it anywhere.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                aria-label="Bouquet share link"
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg bg-black/5 px-3 py-3 text-sm text-black/70 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <button
                type="button"
                onClick={copyShareUrl}
                className={`flex min-w-24 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#DB234F]/40 ${
                  isShareUrlCopied
                    ? "bg-emerald-600"
                    : "bg-[#DB234F] hover:bg-[#B81D42]"
                }`}
              >
                {isShareUrlCopied ? (
                  <>
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy aria-hidden="true" className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <span className="sr-only" aria-live="polite">
              {isShareUrlCopied ? "Bouquet link copied to clipboard" : ""}
            </span>
          </div>
        </div>
      )}

      {/* URL Input Drawer (slides up from bottom) */}
      {showInput && (
        <AddLinkDrawer
          onAdd={(type, mediaId) => {
            addItem(type, mediaId);
            setShowInput(false);
          }}
          onSubmitUrl={handleUrlSubmit}
          onError={showToast}
          onClose={() => setShowInput(false)}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] text-center text-sm sm:text-base px-4 sm:px-6 py-3 rounded-xl shadow-lg backdrop-blur-md animate-fade-in ${
            toast.type === "error"
              ? "bg-red-500/90 text-white"
              : "bg-green-500/90 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Full Screen Modal for viewing embeds */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Media viewer"
          className="fixed inset-0 bg-black/10 backdrop-blur-md z-50 flex items-center justify-center p-4 pt-16"
          onClick={() => setShowModal(null)}
        >
          <div
            className="relative bg-black rounded-2xl overflow-hidden max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(null)}
              aria-label="Close media viewer"
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-2xl focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              ×
            </button>
            {renderEmbed(showModal, true)}
          </div>
        </div>
      )}

    </div>
  );
}
