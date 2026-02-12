"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  saveBouquet,
  loadBouquet,
  type MediaItem,
  type MediaType,
} from "@/lib/supabase";
import { cecilia } from "./fonts";
import {
  InstagramEmbed,
  YouTubeEmbed,
  SpotifyEmbed,
  TwitterEmbed,
  SubstackEmbed,
  LetterboxdEmbed,
  LinkEmbed,
} from "@/components/embeds";

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
const ASCII_FLOWER = `⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡎⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⢦⠀⢀⣤⠶⢖⡒⣢⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠁⡔⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⢩⠀⢡⠏⢀⣠⣼⡆⠀⡩⠤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠎⢠⡆⠈⣦⠀⠀⠀⠀⠀⠀⠀⠀⡎⠌⠀⢈⠔⠡⢦⠛⡏⢶⠁⢀⠑⡀⢀⢔⡆⠙⡱⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⢏⡇⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⡏⣆⠀⠎⠀⠁⠆⠀⡇⠘⣴⣮⣴⠴⡛⢹⠃⠀⢸⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⡡⠈⡇⣘⠀⡇⠀⠀⠀⠀⠀⠀⠀⠇⠙⣷⠇⠀⢰⠀⠀⠁⠀⣻⠏⢀⠎⠀⠈⡄⣠⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠱⡄⢰⡜⡐⡇⠀⠀⠀⠀⠀⠀⠀⠰⢡⠈⢃⠀⠸⠰⠀⠀⢀⠇⠀⠀⠀⡀⢀⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⡀⠀⣀⡀⠀⠈⢄⠱⡘⠇⠀⠀⠀⠀⠀⠀⠀⠈⣄⢂⠘⡀⣦⠀⣀⡬⢊⣠⠊⠀⢀⡠⠚⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⡀⡜⢟⠀⠘⠜⢇⢄⠀⠃⢧⡄⠀⠀⠀⠀⠀⠀⠀⠀⠘⢼⡀⡇⡿⢠⣿⣿⣟⣠⣼⡤⠿⠛⠃⠀⠛⠄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⡔⢀⡈⣶⠆⠀⢄⣈⠆⠱⡄⠀⡷⠔⡟⡅⠀⠀⠀⠀⠀⠀⠀⢳⢷⢧⠛⠛⢿⡿⠳⠘⠛⠛⠐⠀⠤⡀⣴⠟⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣬⠤⠄⠈⡇⠢⠀⠀⠈⠙⠪⣞⡶⠁⠀⠀⣤⠀⠀⠀⠀⠀⠀⣰⠁⢁⠶⠛⠉⠳⢨⡑⣄⡀⠀⣀⠀⡀⡘⣅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣀⣈⡆⠀⠀⢡⠀⠀⠀⠀⠀⠀⢸⡗⠀⣰⡞⠈⣧⠀⠀⠀⠀⣰⣟⠂⠁⠀⠀⠀⠀⠀⠈⡰⠯⠖⣀⡀⠈⠝⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠈⠳⡌⣩⡁⠑⠚⠛⠢⣀⠑⢤⡐⣮⣷⠾⠋⠀⠀⠸⡟⢿⢍⠍⠉⠄⠉⠐⢦⡀⠀⠀⠀⡞⠀⠀⠑⡄⠀⠒⠂⠒⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠑⠦⠽⠁⠂⠠⠄⠀⡈⠙⢻⢛⢷⠇⠀⠀⠀⢼⡇⠄⠃⠀⠄⠈⢃⠈⠂⠈⠲⡀⠊⠀⢰⠀⠀⢰⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠑⠆⢥⣤⠶⠶⠷⢼⣦⣊⣿⠀⠀⠀⠈⣧⠐⡀⠀⠘⡀⠀⠁⠀⠀⠀⡘⡃⠀⠈⠀⠀⡮⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣤⡀⢀⣀⡀⠀⠤⣀⠀⠙⢟⠧⠇⠀⠀⠀⣿⡀⠑⠀⠀⠁⠀⡀⢷⡀⠢⣳⢁⠀⡀⠀⣼⡃⢀⢔⡀⢠⠆⣀⣠⡤⠤⢀⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠉⠂⠐⢏⣓⠮⠮⡑⠄⢀⠑⢿⡆⠀⢸⠇⠱⣄⠀⠀⠀⠀⠈⠠⢼⠀⢸⣿⢰⣡⣰⣗⠈⠀⡄⣺⣯⡾⡛⠁⠁⠀⠀⠈⠐⠀⢤⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠒⣀⣈⣚⢦⣆⡀⢻⣤⡟⠀⠀⢀⣑⣦⣄⡀⠀⠁⣹⡀⢠⣿⣷⣿⣻⡇⡀⠴⠿⠯⢧⣥⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⠬⢦⣿⢀⡰⢚⠻⠹⡙⠛⣟⣦⡐⢽⣷⣿⣿⣿⣿⢟⣁⣀⠠⠐⠈⠁⡜⠀⠀⠀⠀⠀⠀⠀⢀⡴⠁
⠀⠀⠀⠀⠀⠀⠀⡠⣐⣀⣀⢀⡥⡶⠉⠀⠀⠀⣿⠊⠀⠀⠀⠀⠀⢀⠠⠨⠽⠦⢝⣻⣿⣿⣿⣿⣅⠰⠼⠿⢿⣛⡉⠀⠄⠀⠀⠀⢁⡠⠊⠀⠀
⠀⠀⠀⠀⠀⡀⠜⠀⠀⣀⢶⠡⡘⠀⠀⠀⠀⠀⠇⠀⠀⠀⠀⠀⠂⠀⠀⠀⠀⠰⠋⣾⣦⢛⠻⡉⠋⠋⠓⠂⠀⠈⠉⠛⠳⡖⠚⠊⠁⠀⠀⠀⠀
⠀⠀⠀⠀⡐⠉⠀⣠⠊⣁⢂⠔⠁⠀⠀⠀⠀⠀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⢋⣼⢆⠙⡅⠀⠀⠀⠀⠀⠀⠀⠀⠈⢊⡄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⡠⡂⢔⠙⢕⡸⠇⠀⠀⠀⠀⠀⠀⠀⠀⢸⡦⢀⠀⠀⠀⠀⠀⢀⣠⣲⣌⠵⠚⠁⠀⢀⠈⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⡄⠀⠀⠀⠀⠀
⠀⠠⠖⠁⠂⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀⠉⠂⣤⡴⠒⠛⡉⠁⠤⢀⠠⡆⠀⠀⠀⢜⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠃⢠⡞⠉⣤⠊⠁⠈⢠⣴⣭⡜⠀⠀⠀⠀⠀⠉⢢⠀⠀⠀⠀⠀⠀⠀⠀⡜⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣰⢏⢴⣯⠰⠂⠁⢍⠄⠊⠈⠀⠀⠀⠀⠀⠀⠀⠀⠑⠦⣀⡀⠀⠀⠀⢠⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣥⢾⣕⣂⠈⠉⠩⠭⠉⠁⠖⠂⠤⢀⡀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠁⠈⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⡟⠀⠀⠙⢟⣕⠢⣈⠉⠁⠤⠤⠤⠀⢀⠑⢆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠟⠀⠀⠀⠀⠈⢳⣳⠄⠅⠣⠐⠠⢄⣀⢀⣀⠀⣑⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⡾⠋⠀⠀⠀⠀⠀⠀⠀⠉⠓⠤⣀⡀⠀⠄⠀⠈⢉⣀⣀⣀⣒⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⡾⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⠾⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀`;

// Precurated media items for the sidebar
const CURATED_MEDIA = [
  {
    type: "youtube" as MediaType,
    mediaId: "dQw4w9WgXcQ",
    label: "Classic Love Song",
  },
  { type: "youtube" as MediaType, mediaId: "JGwWNGJdvx8", label: "Ed Sheeran" },
  {
    type: "spotify" as MediaType,
    mediaId: "track/4uLU6hMCjMI75M1A2tKUQC",
    label: "Never Gonna Give You Up",
  },
  {
    type: "spotify" as MediaType,
    mediaId: "track/3d9DChrdc6BOeFsbrZ3Is0",
    label: "Cant Help Falling",
  },
  {
    type: "spotify" as MediaType,
    mediaId: "playlist/37i9dQZF1DX50QitC6Oqtn",
    label: "Love Songs Playlist",
  },
  {
    type: "substack" as MediaType,
    mediaId: "https://www.henrikkarlsson.xyz/p/looking-for-alice",
    label: "Looking for Alice",
  },
  {
    type: "youtube" as MediaType,
    mediaId: "450p7goxZqg",
    label: "John Legend",
  },
  {
    type: "spotify" as MediaType,
    mediaId: "track/3AJwUDP919kvQ9QcozQPxg",
    label: "Perfect - Ed Sheeran",
  },
];

function Home() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  const [flowerImage, setFlowerImage] = useState<
    "flowers" | "flowers2" | "ascii"
  >("flowers");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState(
    "Dear,\n\nHappy Valentine's Day!\nI love you like the internet!\n\nSincerely,",
  );
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Show toast notification
  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load bouquet from URL if slug parameter exists
  useEffect(() => {
    const slug = searchParams.get("b");
    if (slug) {
      setIsLoading(true);
      loadBouquet(slug).then((result) => {
        if ("error" in result) {
          showToast("Could not load bouquet: " + result.error, "error");
          setIsLoading(false);
          return;
        }
        setItems(result.items);
        setSavedNote(result.note || null);
        setBgColor(result.bg_color || "#ffffff");
        // Set the flower image based on saved image_url
        if (result.image_url === "/flowers2.png") {
          setFlowerImage("flowers2");
        } else if (result.image_url === "ascii") {
          setFlowerImage("ascii");
        } else {
          setFlowerImage("flowers");
        }
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
      image_url: flowerImage === "ascii" ? "ascii" : `/${flowerImage}.png`,
      paths: [],
      items: items,
      note: note.trim() ? note : null,
      bg_color: bgColor,
    });

    if ("error" in result) {
      showToast("Could not save bouquet: " + result.error, "error");
      setIsSaving(false);
      return;
    }

    const url = `${window.location.origin}?b=${result.slug}`;
    setShareUrl(url);
    setShowNoteModal(false);
    setIsSaving(false);

    // Navigate to the shared page with created flag
    window.location.href = `?b=${result.slug}&created=1`;
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
    setItems((prev) => [...prev, newItem]);
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
      showToast(
        "Please enter a valid Instagram, YouTube, or Spotify URL",
        "error",
      );
    }
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, itemId: string) => {
      if (canvasRef.current) {
        const item = items.find((i) => i.id === itemId);
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
    },
    [items],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging && canvasRef.current) {
        setHasDragged(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
        const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

        setItems(
          items.map((item) =>
            item.id === dragging
              ? {
                  ...item,
                  x: Math.max(5, Math.min(95, x)),
                  y: Math.max(5, Math.min(95, y)),
                }
              : item,
          ),
        );
      }

      if (rotating && canvasRef.current) {
        const item = items.find((i) => i.id === rotating);
        if (item) {
          const rect = canvasRef.current.getBoundingClientRect();
          const centerX = rect.left + (item.x / 100) * rect.width;
          const centerY = rect.top + (item.y / 100) * rect.height;
          const currentAngle =
            Math.atan2(e.clientX - centerX, centerY - e.clientY) *
            (180 / Math.PI);
          const angleDelta = currentAngle - rotateStart.angle;
          const newRotation = rotateStart.itemRotation + angleDelta;

          setItems(
            items.map((i) =>
              i.id === rotating ? { ...i, rotation: newRotation } : i,
            ),
          );
        }
      }

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
    [dragging, rotating, scaling, dragOffset, rotateStart, scaleStart, items],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setRotating(null);
    setScaling(null);
  }, []);

  // Calculate canvas scale based on actual rendered size vs reference size (900px)
  // Using ResizeObserver for reliable size tracking
  useEffect(() => {
    const updateCanvasScale = () => {
      if (canvasRef.current) {
        const width = canvasRef.current.offsetWidth;
        setCanvasScale(width / 900);
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

  // Touch event handlers for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, itemId: string) => {
      if (canvasRef.current && e.touches.length === 1) {
        const touch = e.touches[0];
        const item = items.find((i) => i.id === itemId);
        if (item) {
          const rect = canvasRef.current.getBoundingClientRect();
          const itemX = (item.x / 100) * rect.width;
          const itemY = (item.y / 100) * rect.height;
          setDragOffset({
            x: touch.clientX - rect.left - itemX,
            y: touch.clientY - rect.top - itemY,
          });
          setDragging(itemId);
          setHasDragged(false);
        }
      }
    },
    [items],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (dragging && canvasRef.current && e.touches.length === 1) {
        const touch = e.touches[0];
        setHasDragged(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const x =
          ((touch.clientX - rect.left - dragOffset.x) / rect.width) * 100;
        const y =
          ((touch.clientY - rect.top - dragOffset.y) / rect.height) * 100;

        setItems(
          items.map((item) =>
            item.id === dragging
              ? {
                  ...item,
                  x: Math.max(5, Math.min(95, x)),
                  y: Math.max(5, Math.min(95, y)),
                }
              : item,
          ),
        );
      }
    },
    [dragging, dragOffset, items],
  );

  const handleTouchEnd = useCallback(() => {
    setDragging(null);
    setRotating(null);
    setScaling(null);
  }, []);

  // Listen for Cmd+V / Ctrl+V to paste link directly and ESC to close dialogs
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // ESC to close dialogs
      if (e.key === "Escape") {
        if (showModal) setShowModal(null);
        if (showInput) setShowInput(false);
        if (showNoteModal) setShowNoteModal(false);
        return;
      }

      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "v" &&
        !isViewingShared &&
        !showInput
      ) {
        try {
          const text = await navigator.clipboard.readText();
          const parsed = parseUrl(text);
          if (parsed) {
            e.preventDefault();
            addItem(parsed.type, parsed.id);
          }
        } catch {
          // Clipboard access denied, ignore
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isViewingShared, showInput, showModal, showNoteModal]);

  // Focus trap for modals
  useEffect(() => {
    const isModalOpen = showModal || showInput || showNoteModal;
    if (!isModalOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const modal = document.querySelector('[role="dialog"]');
      if (!modal) return;

      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
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
      const modal = document.querySelector('[role="dialog"]');
      const firstFocusable = modal?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }, 100);

    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [showModal, showInput, showNoteModal]);

  const deleteItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
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

  const createLinkClickHandler = (url: string) =>
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!hasDragged) {
        window.open(url, "_blank", "noopener,noreferrer");
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
            onLinkClick={isModal ? undefined : createLinkClickHandler(item.mediaId)}
          />
        );
      case "letterboxd":
        return (
          <LetterboxdEmbed
            url={item.mediaId}
            isModal={isModal}
            onLinkClick={isModal ? undefined : createLinkClickHandler(item.mediaId)}
          />
        );
      case "link":
        return (
          <LinkEmbed
            url={item.mediaId}
            isModal={isModal}
            onLinkClick={isModal ? undefined : createLinkClickHandler(item.mediaId)}
          />
        );
      default:
        return null;
    }
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
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Canvas area - centered, always maintains 3:4 aspect ratio */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden p-4">
        <div
          ref={canvasRef}
          className="relative w-full max-w-[900px]"
          style={{
            aspectRatio: "3/4",
            maxHeight: "calc(100vh - 2rem)",
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const data = e.dataTransfer.getData("application/json");
            if (data && canvasRef.current) {
              const { type, mediaId } = JSON.parse(data);
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
          <div className="absolute inset-0">
            {flowerImage === "ascii" ? (
              <div className="absolute inset-0 flex items-center justify-center select-none">
                <pre className="text-[0.6rem] sm:text-[1rem] md:text-[1.4rem] leading-[1.1] text-black whitespace-pre font-mono">
                  {ASCII_FLOWER}
                </pre>
              </div>
            ) : (
              <Image
                src={`/${flowerImage}.png`}
                alt="Flower bouquet"
                fill
                className="object-contain select-none"
                draggable={false}
                priority
              />
            )}
          </div>

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
              }}
              onMouseDown={(e) => {
                if (isViewingShared) return;
                e.preventDefault();
                handleMouseDown(e, item.id);
              }}
              onTouchStart={(e) => {
                if (isViewingShared) return;
                handleTouchStart(e, item.id);
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
      <a href="/" className="fixed top-6 left-6 z-40 cursor-pointer">
        <Image
          src="/logo.png"
          alt="Link Bouquet"
          width={350}
          height={88}
          className="h-14 md:h-20 w-auto"
        />
      </a>

      {/* Turtle top right - hide on sharing page */}
      {!isViewingShared && (
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
              className="w-16 h-16 md:w-28 md:h-28"
            />
          </a>
        </div>
      )}

      {/* Spotify embed bottom left - hide on sharing page */}
      {!isViewingShared && (
        <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-40 hidden md:block">
          <iframe
            src="https://open.spotify.com/embed/track/32q1h0jij3ePpp47ShIqVy?utm_source=generator&theme=0"
            width="300"
            height="80"
            className="rounded-xl"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}

      {/* Note display bottom right - only on sharing page */}
      {isViewingShared && savedNote && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 max-w-xs md:max-w-sm">
          <div className="bg-white p-4">
            <p className="text-black text-sm whitespace-pre-wrap">
              {savedNote}
            </p>
          </div>
        </div>
      )}

      {/* Left Sidebar with curated media */}
      {!isViewingShared && (
        <div
          className={`fixed left-0 top-1/2 -translate-y-1/2 z-30 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-[280px]"}`}
        >
          <div className="w-[280px] bg-[#E6E6E6]/50 backdrop-blur-md rounded-r-2xl py-4 flex flex-col relative">
            <div className="px-4 flex flex-col space-y-2">
              {CURATED_MEDIA.map((media, index) => (
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
                  onClick={() => addItem(media.type, media.mediaId)}
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
                  {media.type === "instagram" && (
                    <div className="w-10 h-10 bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] rounded flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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
                  {media.type === "twitter" && (
                    <div className="w-10 h-10 bg-black rounded flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
                </div>
              ))}
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
      )}

      {/* Bottom toolbar - only show when editing */}
      {!isViewingShared && !shareUrl && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 flex justify-between md:justify-start gap-3 z-40 md:flex-col md:w-40">
          {/* Left column on mobile / Top on desktop: Flower toggle + colors */}
          <div className="flex flex-col gap-2 items-center justify-end md:justify-start">
            {/* Flower toggle button */}
            <button
              onClick={() =>
                setFlowerImage(
                  flowerImage === "flowers"
                    ? "flowers2"
                    : flowerImage === "flowers2"
                      ? "ascii"
                      : "flowers",
                )
              }
              className="w-20 md:w-full rounded-lg bg-[#E6E6E6]/50 backdrop-blur-md transition-all overflow-hidden cursor-pointer relative group"
            >
              {flowerImage === "flowers2" ? (
                <div className="w-full aspect-[4/5] flex items-center justify-center bg-white/50">
                  <pre className="text-[0.22rem] md:text-[0.35rem] leading-[1.1] text-black whitespace-pre font-mono">
                    {ASCII_FLOWER}
                  </pre>
                </div>
              ) : (
                <Image
                  src={`/${flowerImage === "flowers" ? "flowers2" : "flowers"}.png`}
                  alt="Switch flowers"
                  width={160}
                  height={200}
                  className="w-full h-auto"
                />
              )}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/40">
                <span className="text-white font-medium text-center text-xs md:text-base">
                  Change
                  <span className="hidden md:inline">
                    <br />
                    Flower
                  </span>
                </span>
              </div>
            </button>

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

      {/* Share URL display - only show when creator just saved */}
      {isViewingShared && searchParams.get("created") === "1" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-white/50 backdrop-blur-xl rounded-xl shadow-xl p-5 flex flex-col gap-3 min-w-[320px]">
            <span className="font-semibold text-lg text-black">Curated</span>
            <p className="text-black">Share this link with someone special:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={typeof window !== "undefined" ? window.location.href : ""}
                readOnly
                className="flex-1 px-4 py-2 bg-black/10 rounded-lg text-black text-sm border-none"
              />
              <button
                onClick={async () => {
                  const currentUrl = window.location.href;
                  if (
                    navigator.share &&
                    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                  ) {
                    try {
                      await navigator.share({ url: currentUrl });
                    } catch {
                      await navigator.clipboard.writeText(currentUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  } else {
                    await navigator.clipboard.writeText(currentUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className={`px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer ${
                  copied
                    ? "bg-[#DB234F]/60 text-white"
                    : "bg-[#DB234F]/80 text-white"
                }`}
              >
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-black transition-colors text-center"
            >
              Create your own
            </a>
          </div>
        </div>
      )}

      {/* Note Modal for Save */}
      {showNoteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-modal-title"
          className="fixed inset-0 bg-black/10 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowNoteModal(false)}
        >
          <div
            className="bg-white/50 backdrop-blur-xl p-6 rounded-2xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="save-modal-title" className="sr-only">
              Add a note to your bouquet
            </h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                "Dear,\n\nHappy Valentine's Day!\nI love you like the internet!\n\nSincerely,"
              }
              className="w-full px-4 py-3 rounded-xl border-none focus:outline-none mb-4 resize-none h-48 bg-transparent"
              autoFocus
            />
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
      )}

      {/* URL Input Modal */}
      {showInput && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="url-modal-title"
          className="fixed inset-0 bg-black/10 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowInput(false)}
        >
          <form
            onSubmit={handleInputSubmit}
            className="bg-white/50 backdrop-blur-xl p-6 rounded-2xl shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="url-modal-title" className="sr-only">
              Add a link
            </h2>
            <p className="text-black text-sm mb-4">
              Paste a link here or use ⌘V anywhere on the canvas. Works with
              YouTube, Spotify, TikTok, Substack & more.
            </p>
            <input
              type="text"
              name="url"
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl border-none bg-black/10 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowInput(false)}
                className="flex-1 px-4 py-3 bg-[#E6E6E6]/50 backdrop-blur-md text-black rounded-lg transition-colors font-medium cursor-pointer"
              >
                Back
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
          aria-modal="true"
          aria-label="Media viewer"
          className="fixed inset-0 bg-black/10 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(null)}
        >
          <div
            className="relative bg-black rounded-2xl overflow-hidden"
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
