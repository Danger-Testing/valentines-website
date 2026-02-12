import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if env vars are set (handles build time)
let supabase: SupabaseClient | null = null
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

// Types for bouquet data
export interface Point {
  x: number
  y: number
}

export type MediaType = 'instagram' | 'youtube' | 'spotify' | 'substack' | 'letterboxd' | 'twitter' | 'tiktok' | 'link'

export interface MediaItem {
  id: string
  type: MediaType
  mediaId: string
  x: number
  y: number
  rotation: number
  scale: number
}

export interface BouquetData {
  image_url: string | null
  paths: Point[][]
  items: MediaItem[]
  note?: string | null
  bg_color?: string | null
  from_name?: string | null
  to_name?: string | null
}

// Generate a short, readable slug for sharing
export function generateSlug(): string {
  const adjectives = ['sweet', 'lovely', 'dear', 'precious', 'tender', 'gentle', 'warm', 'bright', 'rosy', 'golden']
  const nouns = ['heart', 'rose', 'bloom', 'petal', 'garden', 'dream', 'wish', 'kiss', 'hug', 'love']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `${adj}-${noun}-${num}`
}

// Save a bouquet to Supabase
export async function saveBouquet(data: BouquetData): Promise<{ slug: string } | { error: string }> {
  if (!supabase) {
    return { error: 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' }
  }

  const slug = generateSlug()

  const { error } = await supabase
    .from('bouquets')
    .insert({
      slug,
      image_url: data.image_url,
      paths: data.paths,
      items: data.items,
      note: data.note || null,
      bg_color: data.bg_color || '#ffffff',
      from_name: data.from_name || null,
      to_name: data.to_name || null,
    })

  if (error) {
    // If slug collision, retry with new slug
    if (error.code === '23505') {
      return saveBouquet(data)
    }
    return { error: error.message }
  }

  return { slug }
}

// Load a bouquet by slug
export async function loadBouquet(slug: string): Promise<BouquetData | { error: string }> {
  if (!supabase) {
    return { error: 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.' }
  }

  const { data, error } = await supabase
    .from('bouquets')
    .select('image_url, paths, items, note, bg_color, from_name, to_name')
    .eq('slug', slug)
    .single()

  if (error) {
    return { error: error.message }
  }

  return {
    image_url: data.image_url as string | null,
    paths: data.paths as Point[][],
    items: data.items as MediaItem[],
    note: data.note as string | null,
    bg_color: data.bg_color as string | null,
    from_name: data.from_name as string | null,
    to_name: data.to_name as string | null,
  }
}
