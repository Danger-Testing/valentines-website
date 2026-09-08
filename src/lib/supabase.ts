import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Only create client if env vars are set (handles build time)
let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// Types for bouquet data
export interface Point {
  x: number;
  y: number;
}

export type MediaType =
  | "instagram"
  | "youtube"
  | "spotify"
  | "substack"
  | "letterboxd"
  | "twitter"
  | "tiktok"
  | "link";

export interface MediaItem {
  id: string;
  type: MediaType;
  mediaId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface BouquetData {
  image_url: string | null;
  paths: Point[][];
  items: MediaItem[];
  note?: string | null;
  bg_color?: string | null;
  from_name?: string | null;
  to_name?: string | null;
  is_gallery?: boolean;
}

// Generate a short, readable slug for sharing using Latin flower names
export function generateSlug(): string {
  const genus = [
    "rosa",
    "tulipa",
    "lilium",
    "orchis",
    "viola",
    "dahlia",
    "iris",
    "peonia",
    "camellia",
    "magnolia",
    "lotus",
    "crocus",
    "aster",
    "salvia",
    "primula",
  ];
  const species = [
    "alba",
    "rubra",
    "aurea",
    "purpurea",
    "elegans",
    "flora",
    "bella",
    "serena",
    "stellata",
    "grandiflora",
    "minor",
    "major",
    "verna",
    "sylvestris",
    "orientalis",
  ];
  const g = genus[Math.floor(Math.random() * genus.length)];
  const s = species[Math.floor(Math.random() * species.length)];
  const num = crypto.randomUUID().replaceAll("-", "");
  return `${g}-${s}-${num}`;
}

// Save a bouquet to Supabase
export async function saveBouquet(
  data: BouquetData,
): Promise<{ slug: string } | { error: string }> {
  if (!supabase) {
    return {
      error:
        "Bouquet sharing is temporarily unavailable. Please try again later.",
    };
  }

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const slug = generateSlug();

      const { error } = await supabase
        .from("bouquets")
        .insert({
          slug,
          image_url: data.image_url,
          paths: data.paths,
          items: data.items,
          note: data.note || null,
          bg_color: data.bg_color || "#ffffff",
          from_name: data.from_name || null,
          to_name: data.to_name || null,
          is_gallery: data.is_gallery || false,
        })
        .abortSignal(AbortSignal.timeout(12000));

      if (error) {
        // If slug collision, retry with new slug
        if (error.code === "23505") {
          continue;
        }
        return {
          error:
            "We couldn’t save your bouquet. Your draft is still here; please try again.",
        };
      }

      return { slug };
    }
    return { error: "Please try saving again." };
  } catch {
    return {
      error: "We couldn’t connect. Your draft is still here; please try again.",
    };
  }
}

// Load a bouquet by slug
export async function loadBouquet(
  slug: string,
): Promise<BouquetData | { error: string }> {
  if (!supabase) {
    return {
      error:
        "Bouquet sharing is temporarily unavailable. Please try again later.",
    };
  }

  try {
    const result = await supabase
      .rpc("get_bouquet_by_slug", { bouquet_slug: slug })
      .abortSignal(AbortSignal.timeout(12000));
    // During rollout the new client also works before the RPC migration is applied.
    const { data, error } =
      result.error?.code === "PGRST202"
        ? await supabase
            .from("bouquets")
            .select(
              "image_url, paths, items, note, bg_color, from_name, to_name, is_gallery",
            )
            .eq("slug", slug)
            .abortSignal(AbortSignal.timeout(12000))
            .maybeSingle()
        : result;
    if (error)
      return {
        error: "We couldn’t connect to your bouquet. Please try again.",
      };
    if (!data)
      return {
        error:
          "This bouquet could not be found. Check that you have the complete link.",
      };
    return {
      ...data,
      items: Array.isArray(data.items) ? data.items : [],
      paths: Array.isArray(data.paths) ? data.paths : [],
    } as BouquetData;
  } catch {
    return { error: "We couldn’t connect to your bouquet. Please try again." };
  }
}

// Public bouquet data for gallery
export interface PublicBouquet {
  slug: string;
  image_url: string | null;
  items: MediaItem[];
  created_at: string;
}

export const GALLERY_PAGE_SIZE = 120;

export async function loadBouquetPage(
  offset = 0,
): Promise<
  { bouquets: PublicBouquet[]; hasMore: boolean } | { error: string }
> {
  if (!supabase) return { error: "The gallery is temporarily unavailable." };
  try {
    const { data, error } = await supabase
      .from("bouquets")
      .select("slug, image_url, items, created_at")
      .eq("is_gallery", true)
      .order("created_at", { ascending: false })
      .order("slug", { ascending: true })
      .range(offset, offset + GALLERY_PAGE_SIZE)
      .abortSignal(AbortSignal.timeout(12000));
    if (error)
      return { error: "The gallery couldn’t be loaded. Please try again." };
    return {
      bouquets: data
        .slice(0, GALLERY_PAGE_SIZE)
        .map((row) => ({
          ...row,
          items: Array.isArray(row.items) ? row.items : [],
        })) as PublicBouquet[],
      hasMore: data.length > GALLERY_PAGE_SIZE,
    };
  } catch {
    return { error: "The gallery couldn’t be loaded. Please try again." };
  }
}
