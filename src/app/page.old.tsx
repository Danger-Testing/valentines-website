"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { saveBouquet, loadBouquet, type MediaItem, type Point, type MediaType } from "@/lib/supabase";

type Step = 'upload' | 'draw' | 'addLinks';

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
      <p className="text-pink-500 font-medium">Loading...</p>
    </div>
  );
}

// Main page wrapper with Suspense
export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Home />
    </Suspense>
  );
}

function Home() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>('upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [drawnPaths, setDrawnPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPaths, setShowPaths] = useState(true);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [showModal, setShowModal] = useState<MediaItem | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [rotating, setRotating] = useState<string | null>(null);
  const [scaling, setScaling] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotateStart, setRotateStart] = useState({ angle: 0, itemRotation: 0 });
  const [scaleStart, setScaleStart] = useState({ distance: 0, itemScale: 1 });

  // Supabase sharing state
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewingShared, setIsViewingShared] = useState(false);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setUploadedImage(result.image_url);
        setDrawnPaths(result.paths);
        setItems(result.items);
        setStep('addLinks');
        setIsSaved(true);
        setIsViewingShared(true);
        setShowPaths(false);
        setIsLoading(false);
      });
    }
  }, [searchParams]);

  // Handle saving bouquet to Supabase
  const handleSaveBouquet = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const result = await saveBouquet({
      image_url: uploadedImage,
      paths: drawnPaths,
      items: items,
    });

    if ('error' in result) {
      alert('Could not save bouquet: ' + result.error);
      setIsSaving(false);
      return;
    }

    const url = `${window.location.origin}?b=${result.slug}`;
    setShareUrl(url);
    setIsSaved(true);
    setIsSaving(false);
  };

  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setStep('draw');
      };
      reader.readAsDataURL(file);
    }
  };

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (step !== 'draw') return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || step !== 'draw') return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setCurrentPath(prev => [...prev, { x, y }]);

    // Draw on canvas
    const ctx = canvas.getContext('2d');
    if (ctx && currentPath.length > 0) {
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const lastPoint = currentPath[currentPath.length - 1];
      ctx.beginPath();
      ctx.moveTo((lastPoint.x / 100) * canvas.width, (lastPoint.y / 100) * canvas.height);
      ctx.lineTo((x / 100) * canvas.width, (y / 100) * canvas.height);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath.length > 1) {
      setDrawnPaths(prev => [...prev, currentPath]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const clearDrawing = () => {
    setDrawnPaths([]);
    setCurrentPath([]);
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const redrawCanvas = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas || !showPaths) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawnPaths.forEach(path => {
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo((path[0].x / 100) * canvas.width, (path[0].y / 100) * canvas.height);
      path.forEach(point => {
        ctx.lineTo((point.x / 100) * canvas.width, (point.y / 100) * canvas.height);
      });
      ctx.stroke();
    });
  }, [drawnPaths, showPaths]);

  // URL parsing
  const parseUrl = (url: string): { type: MediaType; id: string } | null => {
    const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
    if (igMatch) return { type: 'instagram', id: igMatch[1] };

    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]+)/);
    if (ytMatch) return { type: 'youtube', id: ytMatch[1] };

    const spotifyMatch = url.match(/spotify\.com\/(track|album|playlist)\/([A-Za-z0-9]+)/);
    if (spotifyMatch) return { type: 'spotify', id: `${spotifyMatch[1]}/${spotifyMatch[2]}` };

    return null;
  };

  const addItem = (type: MediaType, mediaId: string) => {
    const newItem: MediaItem = {
      id: crypto.randomUUID(),
      type,
      mediaId,
      x: 50,
      y: 50,
      rotation: 0,
      scale: 1,
    };
    setItems([...items, newItem]);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parseUrl(text);
      if (parsed) {
        addItem(parsed.type, parsed.id);
        setShowInput(false);
      } else {
        alert("Please paste a valid Instagram, YouTube, or Spotify URL");
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
      }
    }
  }, [items]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

      setItems(items.map(item =>
        item.id === dragging
          ? { ...item, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
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

  // Arrange items along drawn paths
  const arrangeAlongPaths = () => {
    if (items.length === 0 || drawnPaths.length === 0) return;

    // Combine all paths into one array of points
    const allPoints: Point[] = [];
    drawnPaths.forEach(path => {
      allPoints.push(...path);
    });

    if (allPoints.length < 2) return;

    // Distribute items evenly along the path
    const arranged = items.map((item, index) => {
      const t = items.length === 1 ? 0.5 : index / (items.length - 1);
      const pointIndex = Math.floor(t * (allPoints.length - 1));
      const point = allPoints[pointIndex];

      // Calculate rotation based on path direction
      let rotation = 0;
      if (pointIndex < allPoints.length - 1) {
        const nextPoint = allPoints[pointIndex + 1];
        rotation = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
      }

      return {
        ...item,
        x: point.x,
        y: point.y,
        rotation: 0, // Keep upright, or use: rotation
        scale: 0.5,
      };
    });

    setItems(arranged);
    setShowPaths(false);

    // Clear the canvas
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
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
        <div className="overflow-hidden w-[200px] h-[400px]">
          <iframe
            src={`https://www.instagram.com/reel/${item.mediaId}/embed`}
            width="330"
            height="620"
            className="border-0 pointer-events-none"
            style={{ marginLeft: '-65px', marginTop: '-55px' }}
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
        <div className="w-[200px] h-[112px] bg-black rounded overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${item.mediaId}`}
            width="200"
            height="112"
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
        <div className="w-[200px] h-[80px] rounded overflow-hidden">
          <iframe
            src={embedUrl}
            width="200"
            height="80"
            className="border-0 pointer-events-none"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      );
    }

    return null;
  };

  // Step 1: Upload Image
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-8 p-8">
        <h1 className="text-3xl font-bold text-pink-500">Create Your Bouquet</h1>
        <p className="text-gray-600">Step 1: Upload a flower image</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-64 h-64 border-4 border-dashed border-pink-300 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-pink-500 hover:bg-pink-50 transition-all cursor-pointer"
        >
          <svg className="w-16 h-16 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-pink-500 font-medium">Click to upload</span>
        </button>

        <p className="text-sm text-gray-400">or use default bouquet</p>
        <button
          onClick={() => {
            setUploadedImage('/flowers.png');
            setStep('draw');
          }}
          className="px-6 py-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
        >
          Use Default Flowers
        </button>
      </div>
    );
  }

  // Step 2: Draw on Image
  if (step === 'draw') {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Fullscreen image */}
        <div className="absolute inset-0 flex items-center justify-center">
          {uploadedImage && (
            <Image
              src={uploadedImage}
              alt="Uploaded flowers"
              fill
              className="object-contain pointer-events-none"
            />
          )}
          <canvas
            ref={drawCanvasRef}
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        {/* Header */}
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg z-40">
          <h1 className="text-lg font-bold text-pink-500">Draw where you want your media</h1>
        </div>

        {/* Bottom buttons */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-40">
          <button
            onClick={clearDrawing}
            className="px-6 py-3 bg-white/90 backdrop-blur text-gray-700 rounded-full hover:bg-white transition-colors shadow-lg"
          >
            Clear
          </button>
          <button
            onClick={() => setStep('upload')}
            className="px-6 py-3 bg-white/90 backdrop-blur text-gray-700 rounded-full hover:bg-white transition-colors shadow-lg"
          >
            Change Image
          </button>
          <button
            onClick={() => setStep('addLinks')}
            disabled={drawnPaths.length === 0}
            className={`px-6 py-3 rounded-full transition-colors shadow-lg ${
              drawnPaths.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-pink-500 text-white hover:bg-pink-600'
            }`}
          >
            Next: Add Links →
          </button>
        </div>

        {/* Path count */}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
          <p className="text-sm text-white bg-black/50 px-4 py-2 rounded-full">
            {drawnPaths.length === 0 ? 'Draw a line on the image' : `${drawnPaths.length} path(s) drawn`}
          </p>
        </div>
      </div>
    );
  }

  // Loading state when loading shared bouquet
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
        <p className="text-pink-500 font-medium">Loading bouquet...</p>
      </div>
    );
  }

  // Step 3: Add Links & Arrange
  return (
    <div
      className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas - fullscreen */}
      <div
        ref={canvasRef}
        className="absolute inset-0"
      >
        {/* Uploaded Image Background */}
        {uploadedImage && (
          <Image
            src={uploadedImage}
            alt="Flowers"
            fill
            className="object-contain pointer-events-none"
            priority
          />
        )}

        {/* Drawing overlay to show paths */}
        {showPaths && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {drawnPaths.map((path, pathIndex) => (
              <polyline
                key={pathIndex}
                points={path.map(p => `${p.x}%,${p.y}%`).join(' ')}
                fill="none"
                stroke="#ec4899"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
            ))}
          </svg>
        )}

        {/* Items */}
        {items.map((item) => (
          <div
            key={item.id}
            className={`absolute ${!isSaved && dragging === item.id ? 'cursor-grabbing z-30' : !isSaved ? 'cursor-grab z-20' : 'z-20'}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
            }}
            onMouseDown={(e) => {
              if (isSaved) return;
              e.preventDefault();
              handleMouseDown(e, item.id);
            }}
          >
            <div className="relative group">
              <div onClick={() => !dragging && !rotating && setShowModal(item)}>
                {renderEmbed(item)}
              </div>
              {!isSaved && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shadow-lg z-10"
                    title="Remove"
                  >
                    ×
                  </button>
                  {/* Rotate handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (canvasRef.current) {
                        const rect = canvasRef.current.getBoundingClientRect();
                        const centerX = rect.left + (item.x / 100) * rect.width;
                        const centerY = rect.top + (item.y / 100) * rect.height;
                        const startAngle = Math.atan2(e.clientX - centerX, centerY - e.clientY) * (180 / Math.PI);
                        setRotateStart({ angle: startAngle, itemRotation: item.rotation });
                      }
                      setRotating(item.id);
                    }}
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shadow-lg z-10"
                    style={{ cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2'%3E%3Cpath d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'/%3E%3C/svg%3E") 12 12, pointer` }}
                    title="Rotate"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
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
                    className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg z-10 cursor-nwse-resize"
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

      {/* Save/Share Button - Top Right */}
      {!isViewingShared && (
        <div className="fixed top-8 right-8 flex flex-col items-end gap-3 z-40">
          {!shareUrl ? (
            <button
              onClick={isSaved ? () => setIsSaved(false) : handleSaveBouquet}
              disabled={isSaving}
              className={`px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 ${
                isSaved
                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                  : isSaving
                    ? 'bg-pink-400 text-white cursor-wait'
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
              }`}
            >
              {isSaved ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </>
              ) : isSaving ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Save & Share
                </>
              )}
            </button>
          ) : (
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-4 flex flex-col gap-3 max-w-sm">
              <div className="flex items-center gap-2 text-pink-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Bouquet saved!</span>
              </div>
              <p className="text-sm text-gray-600">Share this link with someone special:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded-lg border-0 focus:outline-none text-gray-700"
                />
                <button
                  onClick={copyShareUrl}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                    copied ? 'bg-green-500 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={() => {
                  setShareUrl(null);
                  setIsSaved(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline self-start"
              >
                Continue editing
              </button>
            </div>
          )}
        </div>
      )}

      {/* Back to Draw Button - Top Left (only when editing, not viewing shared) */}
      {!isSaved && !isViewingShared && (
        <button
          onClick={() => {
            setShowPaths(true);
            setStep('draw');
          }}
          className="fixed top-8 left-8 px-6 py-3 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all duration-300 flex items-center gap-2 shadow-xl z-40"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Edit Drawing
        </button>
      )}

      {/* Create Your Own button - shown when viewing a shared bouquet */}
      {isViewingShared && (
        <button
          onClick={() => {
            window.location.href = window.location.origin;
          }}
          className="fixed top-8 left-8 px-6 py-3 rounded-full bg-pink-500 hover:bg-pink-600 text-white transition-all duration-300 flex items-center gap-2 shadow-xl z-40"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Your Own
        </button>
      )}

      {/* Bottom Buttons - Only in edit mode (not when viewing shared) */}
      {!isSaved && !isViewingShared && (
        <div className="fixed bottom-8 right-8 flex gap-3 z-40">
          {/* Arrange Button */}
          {items.length > 0 && drawnPaths.length > 0 && (
            <button
              onClick={arrangeAlongPaths}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110"
              title="Arrange along path"
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 1.5.7 2.8 1.8 3.7L8 12l-2.5-1c-.8-.3-1.7.1-2 .9-.3.8.1 1.7.9 2l3.1 1.2-.8 3.1c-.2.8.3 1.6 1.1 1.8.8.2 1.6-.3 1.8-1.1l.9-3.4 1.5.6 1.5-.6.9 3.4c.2.8 1 1.3 1.8 1.1.8-.2 1.3-1 1.1-1.8l-.8-3.1 3.1-1.2c.8-.3 1.2-1.2.9-2-.3-.8-1.2-1.2-2-.9L16 12l-1.3-1.8c1.1-.9 1.8-2.2 1.8-3.7C16.5 4 14.5 2 12 2z"/>
              </svg>
            </button>
          )}
          {/* Plus Button */}
          <button
            onClick={handlePaste}
            className="w-16 h-16 rounded-full bg-pink-500 hover:bg-pink-600 transition-all duration-300 flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110"
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Manual Input Fallback */}
      {showInput && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <form onSubmit={handleInputSubmit} className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-xl">
            <p className="text-gray-600 text-sm">Supports Instagram, YouTube, and Spotify</p>
            <input
              type="text"
              name="url"
              placeholder="Paste URL here"
              className="px-4 py-3 rounded-full border-2 border-pink-300 focus:border-pink-500 focus:outline-none w-80 text-center"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowInput(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hint Text */}
      {items.length === 0 && !showInput && !isSaved && (
        <p className="fixed bottom-8 left-1/2 -translate-x-1/2 text-pink-400 text-sm z-40">
          Click + to add Instagram, YouTube, or Spotify
        </p>
      )}

      {/* Full Screen Modal */}
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
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center z-20 text-xl"
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
