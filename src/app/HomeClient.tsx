"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, X } from "lucide-react";
import {
  saveBouquet,
  loadBouquet,
  type MediaItem,
  type MediaType,
} from "@/lib/supabase";
import { readDraft, writeDraft, type BouquetDraft } from "@/lib/drafts";
import { useDialogViewport } from "@/lib/use-dialog-viewport";
import { PointerDrag } from "@/lib/pointer-gestures";
import {
  InstagramEmbed,
  YouTubeEmbed,
  SpotifyEmbed,
  TwitterEmbed,
  SubstackEmbed,
  LetterboxdEmbed,
  LinkEmbed,
} from "@/components/embeds";

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

export function LoadingFallback() {
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
      <HomeRoute />
    </Suspense>
  );
}

function HomeRoute() {
  const params = useSearchParams();
  return <Home key={params.toString()} />;
}

const FLOWER_OPTIONS = [
  "flowers",
  "flowers2",
  "5",
  "1",
  "2",
  "3",
  "4",
  "6",
  "7",
] as const;
type FlowerOption = (typeof FLOWER_OPTIONS)[number];

// Precurated media items for the sidebar, organized by flower type
const CURATED_BUCKETS = [
  {
    name: "marc",
    pfp: "/pfp.jpg",
    link: "https://x.com/marcgmbh",
    media: [
      {
        type: "spotify" as MediaType,
        mediaId: "track/3gighwbMyIfJKVpauvANY2",
        label: "The City Never Felt So Good - 1tbsp",
      },
      {
        type: "spotify" as MediaType,
        mediaId: "track/1RAiHhh4HfUgcA1ATlg9yA",
        label: "Comin Home - Jespfur & Paula",
      },
      {
        type: "letterboxd" as MediaType,
        mediaId: "https://letterboxd.com/film/tar-2022/",
        label: "Tár (2022)",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "drb-tch9o74",
        label: "WHITE TEE [INCREDIBLE VIBES DISCOVERED]",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "5U4S4ki4YZs",
        label: "Why Humans Create",
      },
      {
        type: "substack" as MediaType,
        mediaId: "https://www.frederikjournals.com/p/the-way-south",
        label: "The Way South",
      },
      {
        type: "link" as MediaType,
        mediaId: "https://magazine.032c.com/magazine/michel-majerus",
        label: "Michel Majerus - 032c",
      },
      {
        type: "letterboxd" as MediaType,
        mediaId: "https://letterboxd.com/film/babylon-2022/",
        label: "Babylon (2022)",
      },
      {
        type: "instagram" as MediaType,
        mediaId: "DLihxUgsawm",
        label: "Instagram",
      },
      {
        type: "instagram" as MediaType,
        mediaId: "DLkKDr1MnXg",
        label: "Instagram",
      },
      {
        type: "spotify" as MediaType,
        mediaId: "track/4E7H6rqgxHdSoeGSS28CTY",
        label: "Benz Friendz - Future ft. André 3000",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "B5kFBFp-9H0",
        label: "YouTube",
      },
      {
        type: "spotify" as MediaType,
        mediaId: "track/2M9ro2krNb7nr7HSprkEgo",
        label: "Fast Car - Tracy Chapman",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "2Dpd_8n3A5U",
        label: "FILMMAKING IS A SPORT",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "pqzcCfUglws",
        label: "The Psychology of Human Misjudgement - Charlie Munger",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "0fKBhvDjuy0",
        label: "Powers of Ten™ (1977)",
      },
      {
        type: "substack" as MediaType,
        mediaId: "https://www.henrikkarlsson.xyz/p/looking-for-alice",
        label: "Looking for Alice",
      },
    ],
  },
  {
    name: "reggie",
    pfp: "/reggie.jpg",
    link: "https://x.com/HipCityReg",
    media: [
      {
        type: "spotify" as MediaType,
        mediaId: "track/5s1mZcxqYhgmlvDxg4IGwt",
        label: "Alma - Jonny Greenwood",
      },
      {
        type: "link" as MediaType,
        mediaId:
          "https://www.newyorker.com/magazine/2016/10/10/sam-altmans-manifest-destiny",
        label: "Sam Altman's Manifest Destiny",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "xhf5bHtf4jk",
        label: "Rare Wine Tasting in the French Countryside",
      },
    ],
  },
  {
    name: "mike",
    pfp: "/mike.jpg",
    link: "https://x.com/immike_wing",
    media: [
      {
        type: "youtube" as MediaType,
        mediaId: "JJxHRnPxmBI",
        label: "Snoopy | Be My Valentine",
      },
      {
        type: "spotify" as MediaType,
        mediaId: "track/1Vk4yRsz0iBzDiZEoFMQyv",
        label: "Mia & Sebastian's Theme - Justin Hurwitz",
      },
      {
        type: "substack" as MediaType,
        mediaId: "https://substack.com/home/post/p-187048525",
        label: "To Be Loved Is to Be Changed",
      },
    ],
  },
  {
    name: "anna",
    pfp: "/anna.JPG",
    link: "https://x.com/hard_boiledbabe",
    media: [
      {
        type: "letterboxd" as MediaType,
        mediaId: "https://letterboxd.com/film/wild-at-heart/",
        label: "Wild at Heart",
      },
      {
        type: "substack" as MediaType,
        mediaId:
          "https://chiasm.substack.com/p/so-much-longing-in-so-little-space",
        label: "So Much Longing in So Little Space",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "mHQmnumnNgo",
        label:
          "Triadisches Ballett von Oskar Schlemmer - Bauhaus (Best Quality)",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "nLCY5Wl6ZMA",
        label: "Bajka [A Fairy Tale] - Poland, 1968",
      },
      {
        type: "spotify" as MediaType,
        mediaId: "playlist/3vDFi3Ggjv9xoLLbbSWvQR",
        label:
          "i have just now come from a party where i was its life and soul. everyon laughed and admired me",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "npol_Y-expQ",
        label: "Angel (Joseph Cornell, 1957)",
      },
      {
        type: "spotify" as MediaType,
        mediaId: "track/1APu9lSrXWUarvP61myILk",
        label: "blue valentines by tom waits",
      },
    ],
  },
  {
    name: "liz",
    pfp: "/liz.png",
    link: "https://www.instagram.com/lizmontesano/",
    media: [
      {
        type: "link" as MediaType,
        mediaId:
          "https://unewsonline.com/2024/10/the-history-and-legacy-of-one-direction/",
        label: "The history and legacy of One Direction",
      },
      {
        type: "link" as MediaType,
        mediaId: "https://onedirection.tumblr.com/",
        label: "One Direction on Tumblr",
      },
      {
        type: "link" as MediaType,
        mediaId: "https://www.bbc.com/news/entertainment-arts-53470098",
        label: "In pictures: 10 years of One Direction",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "syFZfO_wfMQ",
        label: "One Direction - Night Changes",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "QJO3ROT-A4E",
        label: "One Direction - What Makes You Beautiful",
      },
    ],
  },
  {
    name: "lelix",
    pfp: "/lelix.jpg",
    link: "https://www.instagram.com/lelix.jet/",
    media: [
      {
        type: "youtube" as MediaType,
        mediaId: "sAQHr-pnrQo",
        label: "Shrek's Best Scenes",
      },
      {
        type: "spotify" as MediaType,
        mediaId: "track/13toFl1UwJPsRxDiD9jgtn",
        label: "As - Stevie Wonder",
      },
      {
        type: "link" as MediaType,
        mediaId: "https://www.flickr.com/photos/henrylizardlover/3279951706/",
        label: "Flickr Photo",
      },
      {
        type: "letterboxd" as MediaType,
        mediaId: "https://letterboxd.com/film/interstellar/",
        label: "Interstellar (2014)",
      },
    ],
  },
  {
    name: "ceci",
    pfp: "/ceci.jpg",
    link: "https://www.instagram.com/ceciliaazcarate/",
    media: [
      {
        type: "link" as MediaType,
        mediaId: "https://ceciliaazcarate.com/",
        label: "Cecilia Azcarate",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "nFWgiZxnz7o",
        label: "Koudlam - See You All",
      },
      {
        type: "link" as MediaType,
        mediaId: "https://bitcoin.org/bitcoin.pdf",
        label: "Bitcoin Whitepaper",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "MoXrMOsnRVo",
        label: "Tous Les Matins du Monde - Improvisation sur les Folies",
      },
      {
        type: "link" as MediaType,
        mediaId: "https://artsandculture.google.com/asset/EQFVNZZUaQNQQA",
        label: "Stanley Kubrick - Barry Lyndon Portrait",
      },
      {
        type: "link" as MediaType,
        mediaId:
          "https://artsandculture.google.com/asset/the-annunciation-jan-van-eyck/xwFVdn0XxLmf9Q",
        label: "The Annunciation - Jan van Eyck",
      },
      {
        type: "youtube" as MediaType,
        mediaId: "s5MUxuY4Hbw",
        label: "The shooting paintings of Niki de Saint Phalle",
      },
    ],
  },
];

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
  return (
    trimmedNote ||
    `A bouquet with ${itemCount} ${itemCount === 1 ? "link" : "links"}.`
  );
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

// URL parsing
function parseUrl(url: string): { type: MediaType; id: string } | null {
  url = url.trim();
  if (!url) return null;

  // Accept plain domains and pasted links without requiring a protocol.
  const hasScheme =
    /^[a-z][a-z\d+.-]*:/i.test(url) && !/^[^/?#:]+:\d+(?:[/?#]|$)/.test(url);
  try {
    const parsed = new URL(
      url.startsWith("//")
        ? `https:${url}`
        : hasScheme
          ? url
          : `https://${url}`,
    );
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return null;
    if (
      !hasScheme &&
      !parsed.hostname.includes(".") &&
      parsed.hostname !== "localhost"
    ) {
      return null;
    }
    url = parsed.href;
  } catch {
    return null;
  }

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

  const substackMatch = url.match(
    /(?:([a-zA-Z0-9-]+)\.substack\.com|www\.([a-zA-Z0-9-]+)\.[a-z]+)\/p\/([a-zA-Z0-9-]+)/,
  );
  if (substackMatch) return { type: "substack", id: url };

  const letterboxdMatch = url.match(
    /letterboxd\.com\/(?:film\/([a-zA-Z0-9-]+)|([a-zA-Z0-9_]+)\/film\/([a-zA-Z0-9-]+))/,
  );
  if (letterboxdMatch) return { type: "letterboxd", id: url };

  const twitterMatch = url.match(
    /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)/,
  );
  if (twitterMatch) return { type: "twitter", id: twitterMatch[2] };

  // Fallback: any valid web address becomes a generic link.
  return { type: "link", id: url };
}

function Home() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const inputScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Keep validation beside the field visible in a short keyboard viewport.
    if (inputError && inputScrollRef.current) {
      inputScrollRef.current.scrollTop = inputScrollRef.current.scrollHeight;
    }
  }, [inputError]);
  const openLinkInput = () => {
    setInputError(null);
    setShowInput(true);
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBucket, setSelectedBucket] = useState(3);
  const [showModal, setShowModal] = useState<MediaItem | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [scaling, setScaling] = useState<string | null>(null);
  const [scaleStart, setScaleStart] = useState({ distance: 0, itemScale: 1 });

  // Supabase sharing state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isShareUrlCopied, setIsShareUrlCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(searchParams.get("b")));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [savedPreviewUrl, setSavedPreviewUrl] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isViewingShared, setIsViewingShared] = useState(
    Boolean(searchParams.get("b")) && searchParams.get("edit") !== "1",
  );
  const [flowerImage, setFlowerImage] = useState<FlowerOption>("flowers");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState(
    "Happy Valentine's Day!\nI love you like the internet!",
  );
  const [fromName, setFromName] = useState("");
  const [toName, setToName] = useState("");
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [savedFromName, setSavedFromName] = useState<string | null>(null);
  const [savedToName, setSavedToName] = useState<string | null>(null);
  const [isGallery, setIsGallery] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<BouquetDraft | null>(null);
  const [draftStatus, setDraftStatus] = useState("");
  const [undoStack, setUndoStack] = useState<MediaItem[][]>([]);
  const draftKey = `linkbouquet:draft:v1:${searchParams.get("b") || "new"}`;
  const checkpoint = () =>
    setUndoStack((previous) => [...previous.slice(-29), items]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled || isViewingShared) return;
      setPendingDraft(readDraft(draftKey));
      setDraftReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [draftKey, isViewingShared]);

  useEffect(() => {
    if (
      !draftReady ||
      pendingDraft ||
      isViewingShared ||
      isLoading ||
      loadError
    )
      return;
    const success = writeDraft(draftKey, {
      version: 1,
      items,
      flowerImage,
      bgColor,
      note,
      fromName,
      toName,
      isGallery,
    });
    // Storage is external state; report unavailable storage rather than claiming a save.
    const timer = setTimeout(
      () =>
        setDraftStatus(
          success
            ? "Draft saved on this device"
            : "Draft could not be saved on this device",
        ),
      0,
    );
    return () => clearTimeout(timer);
  }, [
    draftKey,
    draftReady,
    pendingDraft,
    isViewingShared,
    isLoading,
    loadError,
    items,
    flowerImage,
    bgColor,
    note,
    fromName,
    toName,
    isGallery,
  ]);

  const resumeDraft = () => {
    if (!pendingDraft) return;
    setItems(pendingDraft.items);
    setFlowerImage(pendingDraft.flowerImage as FlowerOption);
    setBgColor(pendingDraft.bgColor);
    setNote(pendingDraft.note);
    setFromName(pendingDraft.fromName);
    setToName(pendingDraft.toName);
    setIsGallery(pendingDraft.isGallery);
    setPendingDraft(null);
  };
  const copyResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Show toast notification
  const showToast = useCallback(
    (message: string, type: "error" | "success" = "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
    },
    [],
  );

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
    const isEditMode = searchParams.get("edit") === "1";
    if (slug) {
      let cancelled = false;
      loadBouquet(slug)
        .then((result) => {
          if (cancelled) return;
          if ("error" in result) {
            setLoadError(result.error);
            setIsLoading(false);
            return;
          }
          setItems(result.items);
          setSavedNote(result.note || null);
          setSavedFromName(result.from_name || null);
          setSavedToName(result.to_name || null);
          setBgColor(result.bg_color || "#ffffff");
          // Also set editable note/names if in edit mode
          if (isEditMode) {
            setNote(
              result.note ||
                "Happy Valentine's Day!\nI love you like the internet!",
            );
            setFromName(result.from_name || "");
            setToName(result.to_name || "");
          }
          // Set the flower image based on saved image_url
          const match = FLOWER_OPTIONS.find(
            (opt) => result.image_url === `/${opt}.png`,
          );
          setFlowerImage(match || "flowers");
          // Only set as viewing shared if not in edit mode
          if (isEditMode) {
            setIsViewingShared(false);
          } else {
            setIsViewingShared(true);
          }
          setIsLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setLoadError(
            "We couldn’t connect to your bouquet. Please try again.",
          );
          setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [searchParams, retryKey]);

  // Handle saving bouquet to Supabase
  const handleSave = async () => {
    if (isSaving || items.length === 0) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const bouquetData = {
        image_url: `/${flowerImage}.png`,
        paths: [],
        items: items,
        note: note.trim() ? note : null,
        bg_color: bgColor,
        from_name: fromName.trim() ? fromName : null,
        to_name: toName.trim() ? toName : null,
        is_gallery: isGallery,
      };

      const result = await saveBouquet(bouquetData);

      if ("error" in result) {
        setSaveError(result.error);
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
          ? (appdropResult?.shareUrl ?? getAppdropBouquetUrl(result.slug))
          : url,
      );
      setIsShareUrlCopied(false);
      setShowNoteModal(false);
      setIsSaving(false);

      setSavedPreviewUrl(url);
    } catch {
      setSaveError("Your bouquet hasn’t been saved yet. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (type: MediaType, mediaId: string) => {
    checkpoint();
    const newItem: MediaItem = {
      id: crypto.randomUUID(),
      type,
      mediaId,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      rotation: 0,
      scale: 0.8,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleInputSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get("url") as string;
    const parsed = parseUrl(url);
    if (parsed) {
      e.currentTarget.querySelector("input")?.blur();
      addItem(parsed.type, parsed.id);
      setShowInput(false);
    } else {
      setInputError("Please enter a domain or link, like example.com");
      e.currentTarget.querySelector("input")?.focus({ preventScroll: true });
    }
  };

  const itemDragRef = useRef<{
    gesture: PointerDrag;
    item: MediaItem;
    width: number;
    height: number;
    snapshot: MediaItem[];
  } | null>(null);
  const suppressItemClick = useRef(false);
  const startItemDrag = (
    event: React.PointerEvent<HTMLDivElement>,
    item: MediaItem,
  ) => {
    suppressItemClick.current = false;
    if (
      isViewingShared ||
      event.button !== 0 ||
      !event.isPrimary ||
      (event.target instanceof Element &&
        event.target.closest("button, [data-scale-handle]"))
    )
      return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return;
    itemDragRef.current = {
      gesture: new PointerDrag(event),
      item,
      width: rect.width,
      height: rect.height,
      snapshot: items,
    };
  };
  const moveItemDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = itemDragRef.current;
    const delta = drag?.gesture.move(event);
    if (!drag || !delta) return;
    if (delta.started) {
      setUndoStack((previous) => [...previous.slice(-29), drag.snapshot]);
      setDragging(drag.item.id);
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    suppressItemClick.current = true;
    setItems((previous) =>
      previous.map((item) =>
        item.id === drag.item.id
          ? {
              ...item,
              x: Math.max(
                5,
                Math.min(95, drag.item.x + (delta.x / drag.width) * 100),
              ),
              y: Math.max(
                5,
                Math.min(95, drag.item.y + (delta.y / drag.height) * 100),
              ),
            }
          : item,
      ),
    );
  };
  const finishItemDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const result = itemDragRef.current?.gesture.end(event.pointerId);
    if (!result) return;
    suppressItemClick.current = result.moved || event.type === "pointercancel";
    itemDragRef.current = null;
    setDragging(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (scaling && canvasRef.current) {
        const item = items.find((i) => i.id === scaling);
        if (item) {
          const rect = canvasRef.current.getBoundingClientRect();
          const centerX = rect.left + (item.x / 100) * rect.width;
          const centerY = rect.top + (item.y / 100) * rect.height;
          const currentDistance = Math.sqrt(
            Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2),
          );
          const scaleFactor = currentDistance / scaleStart.distance;
          const newScale = Math.max(
            0.3,
            Math.min(3, scaleStart.itemScale * scaleFactor),
          );

          setItems(
            items.map((i) =>
              i.id === scaling ? { ...i, scale: newScale } : i,
            ),
          );
        }
      }
    },
    [scaling, scaleStart, items],
  );

  const handleMouseUp = useCallback(() => {
    setScaling(null);
  }, []);

  const attachCanvas = useCallback((node: HTMLDivElement | null) => {
    canvasRef.current = node;
    if (!node) return;
    const observer = new ResizeObserver(() =>
      setCanvasScale(node.offsetWidth / 900),
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handlePasteEvent = (event: ClipboardEvent) => {
      if (
        isViewingShared ||
        showInput ||
        showNoteModal ||
        shareUrl ||
        pendingDraft ||
        showModal
      )
        return;
      if (
        event.target instanceof Element &&
        event.target.closest('input, textarea, [contenteditable="true"]')
      )
        return;
      const parsed = parseUrl(event.clipboardData?.getData("text/plain") || "");
      if (!parsed) return;
      event.preventDefault();
      setUndoStack((previous) => [...previous.slice(-29), items]);
      setItems((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          type: parsed.type,
          mediaId: parsed.id,
          x: 50,
          y: 50,
          rotation: 0,
          scale: 0.8,
        },
      ]);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        event.key.toLowerCase() === "z" &&
        !isViewingShared &&
        !showInput &&
        !showNoteModal &&
        !shareUrl &&
        !pendingDraft &&
        !showModal &&
        !(
          event.target instanceof Element &&
          event.target.closest('input, textarea, [contenteditable="true"]')
        )
      ) {
        const previous = undoStack.at(-1);
        if (previous) {
          event.preventDefault();
          setItems(previous);
          setUndoStack((stack) => stack.slice(0, -1));
        }
        return;
      }
      if (event.key !== "Escape" || isSaving || pendingDraft) return;
      setShowModal(null);
      setShowInput(false);
      setShowNoteModal(false);
      setShareUrl(null);
    };
    window.addEventListener("paste", handlePasteEvent);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("paste", handlePasteEvent);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [
    isViewingShared,
    showInput,
    showModal,
    showNoteModal,
    shareUrl,
    pendingDraft,
    isSaving,
    items,
    undoStack,
  ]);

  useDialogViewport(
    Boolean(
      showModal ||
      showInput ||
      showNoteModal ||
      shareUrl ||
      (pendingDraft && !isLoading),
    ),
  );

  // Focus trap for modals
  useEffect(() => {
    const isModalOpen =
      showModal ||
      showInput ||
      showNoteModal ||
      shareUrl ||
      (pendingDraft && !isLoading);
    if (!isModalOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const modal = document.querySelector<HTMLElement>('[role="dialog"]');
      if (!modal) return;

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === modal)
      ) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Focus first focusable element in modal
    const focusTimer = setTimeout(() => {
      const modal = document.querySelector<HTMLElement>('[role="dialog"]');
      if (modal?.contains(document.activeElement)) return;
      const firstFocusable = modal?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      // On touch devices, let the user choose a field without opening the
      // keyboard and shifting focus as soon as the save sheet appears.
      const target = window.matchMedia("(pointer: coarse)").matches
        ? modal
        : firstFocusable;
      target?.focus({ preventScroll: true });
    }, 100);

    window.addEventListener("keydown", handleTab);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleTab);
      if (previouslyFocused?.isConnected)
        previouslyFocused.focus({ preventScroll: true });
    };
  }, [showModal, showInput, showNoteModal, shareUrl, pendingDraft, isLoading]);

  const deleteItem = (id: string) => {
    checkpoint();
    setItems(items.filter((i) => i.id !== id));
  };

  const createLinkClickHandler = (url: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    {
      try {
        const target = new URL(url);
        if (target.protocol === "https:" || target.protocol === "http:")
          window.open(target.href, "_blank", "noopener,noreferrer");
      } catch {
        showToast("This link is not a valid web address.");
      }
    }
  };

  const renderEmbed = (item: MediaItem, isModal: boolean = false) => {
    switch (item.type) {
      case "instagram":
        return <InstagramEmbed mediaId={item.mediaId} isModal={isModal} />;
      case "youtube":
        return <YouTubeEmbed mediaId={item.mediaId} isModal={isModal} />;
      case "spotify":
        return <SpotifyEmbed mediaId={item.mediaId} isModal={isModal} />;
      case "twitter":
        return <TwitterEmbed mediaId={item.mediaId} isModal={isModal} />;
      case "substack":
        return (
          <SubstackEmbed
            url={item.mediaId}
            isModal={isModal}
            onLinkClick={
              isModal ? undefined : createLinkClickHandler(item.mediaId)
            }
          />
        );
      case "letterboxd":
        return (
          <LetterboxdEmbed
            url={item.mediaId}
            isModal={isModal}
            onLinkClick={
              isModal ? undefined : createLinkClickHandler(item.mediaId)
            }
          />
        );
      case "link":
        return (
          <LinkEmbed
            url={item.mediaId}
            isModal={isModal}
            onLinkClick={
              isModal ? undefined : createLinkClickHandler(item.mediaId)
            }
          />
        );
      default:
        return null;
    }
  };

  if (loadError)
    return (
      <main className="min-h-screen flex items-center justify-center bg-white p-6 text-black">
        <div className="max-w-sm text-center space-y-5" role="alert">
          <h1 className="text-2xl font-medium">
            Your bouquet couldn’t be opened
          </h1>
          <p>{loadError}</p>
          <button
            className="rounded-lg bg-[#DB234F] px-6 py-3 text-white"
            onClick={() => {
              setLoadError(null);
              setIsLoading(true);
              setRetryKey((key) => key + 1);
            }}
          >
            Try again
          </button>
          <Link className="block underline" href="/">
            Create a bouquet
          </Link>
        </div>
      </main>
    );

  // Loading state
  if (isLoading || (!isViewingShared && !draftReady)) {
    return <LoadingFallback />;
  }

  return (
    <div
      className="h-dvh min-h-0 relative overflow-hidden"
      style={{ backgroundColor: bgColor }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-4">
        <div
          ref={attachCanvas}
          className="relative w-full max-w-[900px]"
          style={{
            aspectRatio: "3/4",
            maxHeight: "calc(100dvh - 2rem)",
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (isViewingShared) return;
            const data = e.dataTransfer.getData("application/json");
            if (data && canvasRef.current) {
              let payload;
              try {
                payload = JSON.parse(data);
              } catch {
                return;
              }
              if (!payload || typeof payload !== "object") return;
              const { type, mediaId } = payload;
              if (
                typeof mediaId !== "string" ||
                ![
                  "youtube",
                  "spotify",
                  "link",
                  "twitter",
                  "instagram",
                  "letterboxd",
                  "substack",
                ].includes(type)
              )
                return;
              checkpoint();
              const rect = canvasRef.current.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              const newItem: MediaItem = {
                id: crypto.randomUUID(),
                type,
                mediaId,
                x: Math.max(5, Math.min(95, x)),
                y: Math.max(5, Math.min(95, y)),
                rotation: 0,
                scale: 0.8,
              };
              setItems((prev) => [...prev, newItem]);
            }
          }}
        >
          {/* Flowers background */}
          {flowerImage !== "5" && (
            <div
              className={`absolute inset-x-[8%] md:inset-x-0 ${["1", "2", "3", "4", "6", "7"].includes(flowerImage) ? "-bottom-[2%] -top-[50%]" : "-bottom-[40%] -top-[10%]"}`}
            >
              <Image
                src={`/${flowerImage}.png`}
                alt="Flower bouquet"
                fill
                className={`${["1", "2", "3", "4", "6", "7"].includes(flowerImage) ? "object-contain object-bottom" : "object-contain"} select-none`}
                draggable={false}
                priority
              />
              {/* Clickable area on flower to paste link or open drawer */}
              {!isViewingShared && (
                <button
                  onClick={openLinkInput}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 cursor-pointer z-10"
                  aria-label="Add link"
                />
              )}
            </div>
          )}

          {/* Empty state prompt */}
          {!isViewingShared && items.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-6 text-left max-w-sm shadow-lg">
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
                  When it&apos;s ready, click Save & Share
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
                !isViewingShared && dragging === item.id
                  ? "cursor-grabbing z-30"
                  : !isViewingShared
                    ? "cursor-grab z-20 hover:z-30"
                    : "z-20"
              }`}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale * canvasScale})`,
                touchAction: isViewingShared ? "manipulation" : "pinch-zoom",
                userSelect: "none",
              }}
              onPointerDown={(event) => startItemDrag(event, item)}
              onPointerMove={moveItemDrag}
              onPointerUp={finishItemDrag}
              onPointerCancel={finishItemDrag}
              onLostPointerCapture={finishItemDrag}
              onClickCapture={(event) => {
                if (suppressItemClick.current && event.detail !== 0) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
              onDragStart={(event) => event.preventDefault()}
            >
              <div className="relative group">
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${item.type === "link" ? "website" : item.type}. Use arrow keys to move while editing.`}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setShowModal(item);
                    }
                    if (
                      !isViewingShared &&
                      [
                        "ArrowLeft",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowDown",
                      ].includes(event.key)
                    ) {
                      event.preventDefault();
                      checkpoint();
                      const step = event.shiftKey ? 5 : 1;
                      setItems((previous) =>
                        previous.map((value) =>
                          value.id === item.id
                            ? {
                                ...value,
                                x: Math.max(
                                  5,
                                  Math.min(
                                    95,
                                    value.x +
                                      (event.key === "ArrowRight"
                                        ? step
                                        : event.key === "ArrowLeft"
                                          ? -step
                                          : 0),
                                  ),
                                ),
                                y: Math.max(
                                  5,
                                  Math.min(
                                    95,
                                    value.y +
                                      (event.key === "ArrowDown"
                                        ? step
                                        : event.key === "ArrowUp"
                                          ? -step
                                          : 0),
                                  ),
                                ),
                              }
                            : value,
                        ),
                      );
                    }
                  }}
                  onClick={() => setShowModal(item)}
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
                      style={
                        {
                          "--inverse-item-scale":
                            1 / Math.max(0.05, item.scale * canvasScale),
                        } as React.CSSProperties
                      }
                      className="media-remove absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#E6E6E6]/50 backdrop-blur-md border-2 border-[#EAEAEA] hover:bg-white/90 text-black flex items-center justify-center shadow-lg md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-black/30"
                      title="Remove"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    {/* Scale handle - hidden on mobile */}
                    <div
                      data-scale-handle
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (canvasRef.current) {
                          const rect =
                            canvasRef.current.getBoundingClientRect();
                          const centerX =
                            rect.left + (item.x / 100) * rect.width;
                          const centerY =
                            rect.top + (item.y / 100) * rect.height;
                          const startDistance = Math.sqrt(
                            Math.pow(e.clientX - centerX, 2) +
                              Math.pow(e.clientY - centerY, 2),
                          );
                          setScaleStart({
                            distance: startDistance,
                            itemScale: item.scale,
                          });
                        }
                        checkpoint();
                        setScaling(item.id);
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
      <Link
        href="/"
        className="fixed top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 z-20 cursor-pointer"
      >
        <Image
          src="/logo.png"
          alt="Link Bouquet"
          width={500}
          height={400}
          className="h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56 w-auto"
          style={
            flowerImage === "5"
              ? {
                  filter:
                    "brightness(0) saturate(100%) invert(24%) sepia(95%) saturate(4000%) hue-rotate(355deg) brightness(97%) contrast(95%)",
                }
              : undefined
          }
        />
      </Link>

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
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-40">
        <Image
          src="/turtle.png"
          alt="Turtle"
          width={150}
          height={150}
          className="w-12 h-12 md:w-20 md:h-20"
        />
      </div>

      {/* Note display bottom right - only on sharing page */}
      {isViewingShared && (savedNote || savedFromName || savedToName) && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 max-w-xs md:max-w-sm">
          <div className="bg-[#E6E6E6]/50 backdrop-blur-md rounded-xl p-4">
            {(savedFromName || savedToName) && (
              <div className="flex items-center gap-2 mb-3">
                <span className="text-black text-sm font-normal">
                  {savedFromName || "?"}
                </span>
                <span className="text-black/50 text-sm">+</span>
                <span className="text-black text-sm font-normal">
                  {savedToName || "?"}
                </span>
              </div>
            )}
            {savedNote && (
              <p className="text-black text-sm whitespace-pre-wrap">
                {savedNote}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Left Sidebar with curated media */}
      {!isViewingShared && (
        <div
          className={`fixed left-0 top-1/2 -translate-y-1/2 z-30 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-[280px]"}`}
        >
          <div
            inert={!sidebarOpen}
            className="w-[280px] bg-[#E6E6E6]/50 backdrop-blur-md rounded-r-2xl py-4 flex flex-col relative"
          >
            {/* Profile pictures rows */}
            <div className="px-4 pb-2">
              {/* First row */}
              <div className="flex justify-between mb-2">
                {CURATED_BUCKETS.slice(0, 5).map((bucket, i) => (
                  <button
                    key={i}
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
              {/* Second row */}
              {CURATED_BUCKETS.length > 5 && (
                <div className="flex justify-start gap-[calc((100%-200px)/4)]">
                  {CURATED_BUCKETS.slice(5).map((bucket, i) => (
                    <button
                      key={i + 5}
                      onClick={() => setSelectedBucket(i + 5)}
                      className={`rounded-full transition-all ${selectedBucket === i + 5 ? "scale-110" : "opacity-60 hover:opacity-100"}`}
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
              )}
            </div>
            {/* Media items for selected bucket */}
            <div className="px-4 pt-2 flex flex-col space-y-2 max-h-[460px] overflow-y-auto">
              {CURATED_BUCKETS[selectedBucket].media.map((media, index) => (
                <button
                  type="button"
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
                  {media.type === "youtube" && (
                    <div className="w-10 h-10 bg-[#FF0000] rounded flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </div>
                  )}
                  {media.type === "spotify" && (
                    <div className="w-10 h-10 bg-[#1DB954] rounded flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                    </div>
                  )}
                  {media.type === "substack" && (
                    <div className="w-10 h-10 bg-[#FF6719] rounded flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
                      </svg>
                    </div>
                  )}
                  {media.type === "letterboxd" && (
                    <div className="w-10 h-10 bg-[#00e054] rounded flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-[#14181c]"
                        fill="currentColor"
                        viewBox="0 0 500 500"
                      >
                        <path d="M250 0C111.93 0 0 111.93 0 250s111.93 250 250 250 250-111.93 250-250S388.07 0 250 0zm0 472.73C128.52 472.73 27.27 371.48 27.27 250S128.52 27.27 250 27.27 472.73 128.52 472.73 250 371.48 472.73 250 472.73z" />
                        <circle cx="250" cy="250" r="110" />
                      </svg>
                    </div>
                  )}
                  {media.type === "link" && (
                    <div className="w-10 h-10 bg-gray-500 rounded flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-black text-sm font-medium truncate block">
                      {media.label}
                    </span>
                    <span className="text-black/50 text-xs capitalize">
                      {media.type}
                    </span>
                  </div>
                </button>
              ))}
              {CURATED_BUCKETS[selectedBucket].media.length === 0 && (
                <p className="text-black/50 text-sm text-center py-4">
                  No links yet
                </p>
              )}
              {CURATED_BUCKETS[selectedBucket].media.length > 0 && (
                <p className="text-black/50 text-xs text-center pt-4 italic">
                  Curated by{" "}
                  <a
                    href={CURATED_BUCKETS[selectedBucket].link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {CURATED_BUCKETS[selectedBucket].name}
                  </a>
                </p>
              )}
            </div>
          </div>
          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={
              sidebarOpen ? "Close curated links" : "Try a curated link"
            }
            aria-expanded={sidebarOpen}
            className="absolute top-1/2 -translate-y-1/2 -right-10 w-10 h-20 bg-[#E6E6E6]/50 backdrop-blur-md rounded-r-lg flex items-center justify-center text-black/50 hover:text-black transition-colors focus-visible:ring-2 focus-visible:ring-black"
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
      )}

      {/* Bottom toolbar - only show when editing */}
      {!isViewingShared && !shareUrl && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 flex justify-between md:justify-start gap-3 z-40 md:flex-col md:w-40">
          {/* Left column on mobile / Top on desktop: Flower toggle + colors */}
          <div className="flex flex-col gap-2 items-center justify-end md:justify-start">
            {/* Flower grid selector */}
            <div className="grid grid-cols-3 gap-1.5 md:gap-2">
              {FLOWER_OPTIONS.map((option) => (
                <button
                  key={option}
                  aria-pressed={flowerImage === option}
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
              {/* Pink square */}
              <button
                onClick={() => setBgColor("#F77196")}
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#E6E6E6]/50 backdrop-blur-md hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
                title="Pink background"
              >
                <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-[#F77196]" />
              </button>
              {/* Red square */}
              <button
                onClick={() => setBgColor("#C2021B")}
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#E6E6E6]/50 backdrop-blur-md hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
                title="Red background"
              >
                <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-[#C2021B]" />
              </button>
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
          <div className="flex flex-col gap-2 md:gap-3 w-28 md:w-full md:flex-none justify-end md:justify-start">
            {/* Add link button */}
            <button
              onClick={openLinkInput}
              aria-label="Add a link to your bouquet"
              className="h-12 w-full rounded-lg bg-[#E6E6E6]/50 backdrop-blur-md transition-all flex items-center justify-center text-black cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/30"
            >
              <span className="font-medium text-sm md:text-base">Add Link</span>
            </button>

            {/* Save button */}
            <button
              onClick={() => {
                setSaveError(null);
                setShowNoteModal(true);
              }}
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

      {!isViewingShared && !pendingDraft && (
        <p className="sr-only" role="status">
          {draftStatus}
        </p>
      )}
      {pendingDraft && !isViewingShared && (
        <div
          role="dialog"
          tabIndex={-1}
          aria-modal="true"
          aria-labelledby="resume-title"
          className="dialog-viewport fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
        >
          <div className="dialog-panel overflow-y-auto rounded-2xl bg-white p-6 max-w-sm text-black shadow-xl">
            <h2 id="resume-title" className="text-xl font-medium">
              Your bouquet is still here
            </h2>
            <p className="my-4 text-sm text-black/60">
              Pick up your saved draft with {pendingDraft.items.length}{" "}
              {pendingDraft.items.length === 1 ? "link" : "links"}, or start
              fresh.
            </p>
            <button
              className="rounded-lg bg-[#DB234F] px-5 py-3 text-white"
              onClick={resumeDraft}
            >
              Resume draft
            </button>
            <button
              className="ml-3 underline text-sm"
              onClick={() => setPendingDraft(null)}
            >
              Start fresh
            </button>
          </div>
        </div>
      )}

      {/* Note Modal for Save */}
      {showNoteModal && (
        <div
          role="dialog"
          tabIndex={-1}
          aria-modal="true"
          aria-labelledby="save-modal-title"
          className="dialog-viewport fixed inset-0 bg-black/10 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isSaving) setShowNoteModal(false);
          }}
        >
          <div
            className="dialog-panel flex flex-col bg-white/50 backdrop-blur-xl rounded-2xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-h-0 overflow-y-auto overscroll-contain p-6">
              <h2 id="save-modal-title" className="sr-only">
                Add a note to your bouquet
              </h2>
              {/* From / To row */}
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  maxLength={200}
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="From"
                  aria-label="From"
                  className="flex-1 min-w-0 px-4 py-3 rounded-lg border-none bg-black/10 focus:outline-none font-normal"
                />
                <input
                  type="text"
                  maxLength={200}
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  placeholder="To"
                  aria-label="To"
                  className="flex-1 min-w-0 px-4 py-3 rounded-lg border-none bg-black/10 focus:outline-none font-normal"
                />
              </div>
              <textarea
                aria-label="Personal note"
                maxLength={10000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Happy Valentine's Day!\nI love you like the internet!"
                className="w-full px-4 py-3 rounded-xl border-none focus:outline-none mb-4 resize-none h-36 bg-transparent"
              />
              <label className="flex items-center gap-3 mb-2 cursor-pointer group">
                <div
                  className="relative w-12 h-7 rounded-full bg-black/10 transition-colors duration-200 ease-in-out peer-focus:ring-2 peer-focus:ring-[#DB234F]/50"
                  style={{
                    backgroundColor: isGallery ? "#DB234F" : "rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out"
                    style={{
                      transform: isGallery
                        ? "translateX(20px)"
                        : "translateX(0)",
                    }}
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
              <p className="mb-4 text-xs text-black/60">
                Anyone with your link can open this bouquet. Turn on the gallery
                to let people discover it, including your note.
              </p>
              {saveError && (
                <p role="alert" className="mb-4 text-sm text-red-800">
                  {saveError}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-3 p-6 pt-0">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (!isSaving) setShowNoteModal(false);
                }}
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
      )}

      {/* Saved/share dialog for the embedded AppDrop experience */}
      {shareUrl && !isViewingShared && (
        <div
          role="dialog"
          tabIndex={-1}
          aria-modal="true"
          aria-labelledby="share-modal-title"
          className="dialog-viewport fixed inset-0 z-[60] flex items-center justify-center bg-black/10 p-4 backdrop-blur-md"
          onClick={() => setShareUrl(null)}
        >
          <div
            className="dialog-panel overflow-y-auto w-full max-w-md rounded-2xl bg-white/90 p-6 shadow-xl backdrop-blur-xl"
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
                  {isRunningInAppdropFrame()
                    ? "Saved and ready to share in chat"
                    : "Your bouquet is ready"}
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
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <button
                className="rounded-lg bg-black/5 px-4 py-3"
                onClick={async () => {
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: "Link Bouquet",
                        url: shareUrl,
                      });
                    } catch (error) {
                      if (
                        !(error instanceof Error && error.name === "AbortError")
                      )
                        await copyShareUrl();
                    }
                  } else await copyShareUrl();
                }}
              >
                Share
              </button>
              <a
                className="rounded-lg bg-black/5 px-4 py-3"
                href={savedPreviewUrl || shareUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Preview
              </a>
              <button className="underline" onClick={() => setShareUrl(null)}>
                Keep editing
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
        <div
          role="dialog"
          tabIndex={-1}
          aria-modal="true"
          aria-labelledby="url-modal-title"
          className="dialog-viewport dialog-drawer fixed inset-0 z-50 flex items-end justify-center bg-black/10"
          onClick={() => setShowInput(false)}
        >
          <form
            onSubmit={handleInputSubmit}
            className="dialog-panel flex flex-col bg-white/80 backdrop-blur-xl rounded-t-2xl shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              ref={inputScrollRef}
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
                type="text"
                name="url"
                inputMode="url"
                enterKeyHint="done"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                aria-label="Domain or link"
                aria-invalid={Boolean(inputError)}
                aria-describedby={inputError ? "link-input-error" : undefined}
                onChange={() => setInputError(null)}
                placeholder="example.com or any link"
                className="w-full px-4 py-3 rounded-xl border-none bg-black/10 focus:outline-none mb-4"
                autoFocus
              />
              {inputError && (
                <p
                  id="link-input-error"
                  role="alert"
                  className="mb-4 text-sm text-red-800"
                >
                  {inputError}
                </p>
              )}
            </div>
            <div className="dialog-actions flex shrink-0 gap-3 px-6 pt-2 pb-6">
              <button
                type="button"
                onClick={() => setShowInput(false)}
                className="flex-1 px-4 py-3 bg-[#E6E6E6]/50 backdrop-blur-md text-black rounded-lg transition-colors font-medium cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-[#DB234F] backdrop-blur-md text-white rounded-lg transition-colors font-medium cursor-pointer"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg backdrop-blur-md animate-fade-in ${
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
          tabIndex={-1}
          aria-modal="true"
          aria-label="Media viewer"
          className="dialog-viewport fixed inset-0 bg-black/10 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(null)}
        >
          <div
            className="relative w-fit max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowModal(null)}
              aria-label="Close media viewer"
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-black flex items-center justify-center text-2xl focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              ×
            </button>
            <div
              className="max-w-[calc(100vw-2rem)] overflow-auto rounded-2xl bg-black"
              style={{ maxHeight: "calc(var(--dialog-height, 100dvh) - 7rem)" }}
            >
              {renderEmbed(showModal, true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
