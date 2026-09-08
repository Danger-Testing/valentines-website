import type { MediaItem } from "./supabase";

export interface BouquetDraft {
  version: 1;
  items: MediaItem[];
  flowerImage: string;
  bgColor: string;
  note: string;
  fromName: string;
  toName: string;
  isGallery: boolean;
}

export function validDraft(value: unknown): value is BouquetDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as BouquetDraft;
  return (
    draft.version === 1 &&
    Array.isArray(draft.items) &&
    draft.items.length <= 200 &&
    draft.items.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.mediaId === "string" &&
        [
          "youtube",
          "spotify",
          "instagram",
          "twitter",
          "substack",
          "letterboxd",
          "link",
          "tiktok",
        ].includes(item.type) &&
        [item.x, item.y, item.rotation, item.scale].every(Number.isFinite) &&
        item.scale > 0 &&
        item.scale <= 3,
    ) &&
    ["flowers", "flowers2", "5", "1", "2", "3", "4", "6", "7"].includes(
      draft.flowerImage,
    ) &&
    /^#[0-9a-f]{6}$/i.test(draft.bgColor) &&
    typeof draft.note === "string" &&
    typeof draft.fromName === "string" &&
    typeof draft.toName === "string" &&
    typeof draft.isGallery === "boolean"
  );
}

export function readDraft(key: string): BouquetDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw.length > 1_000_000) return null;
    const draft: unknown = JSON.parse(raw);
    return validDraft(draft) ? draft : null;
  } catch {
    return null;
  }
}

export function writeDraft(key: string, draft: BouquetDraft): boolean {
  try {
    if (!validDraft(draft)) return false;
    if (
      !draft.items.length &&
      !draft.fromName &&
      !draft.toName &&
      draft.note === "Happy Valentine's Day!\nI love you like the internet!" &&
      draft.flowerImage === "flowers" &&
      draft.bgColor === "#ffffff"
    )
      localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}
