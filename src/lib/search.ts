import type { MediaType } from "./supabase";

// Services /api/search can query directly
export type SearchSource = "youtube" | "spotify" | "twitter" | "letterboxd";

export type SearchResult = {
  type: MediaType;
  mediaId: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  // Set when the final link is looked up only once the result is picked
  // (Letterboxd films are found by IMDb id)
  resolve?: string;
};
