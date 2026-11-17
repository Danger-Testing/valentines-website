import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if env vars are set (handles build time)
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

const NOT_CONFIGURED = {
  error: 'Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
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
  items: MediaItem[]
  note: string | null
  bg_color: string | null
  from_name: string | null
  to_name: string | null
}

// Generate a short, readable slug for sharing using Latin flower names
function generateSlug(): string {
  const genus = ['rosa', 'tulipa', 'lilium', 'orchis', 'viola', 'dahlia', 'iris', 'peonia', 'camellia', 'magnolia', 'lotus', 'crocus', 'aster', 'salvia', 'primula']
  const species = ['alba', 'rubra', 'aurea', 'purpurea', 'elegans', 'flora', 'bella', 'serena', 'stellata', 'grandiflora', 'minor', 'major', 'verna', 'sylvestris', 'orientalis']
  const g = genus[Math.floor(Math.random() * genus.length)]
  const s = species[Math.floor(Math.random() * species.length)]
  const num = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `${g}-${s}-${num}`
}

// Save a bouquet to Supabase
export async function saveBouquet(
  data: BouquetData & { is_gallery: boolean },
): Promise<{ slug: string } | { error: string }> {
  if (!supabase) return NOT_CONFIGURED

  const slug = generateSlug()

  // `paths` is a legacy column that is always written empty
  const { error } = await supabase.from('bouquets').insert({ slug, paths: [], ...data })

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
  if (!supabase) return NOT_CONFIGURED

  const { data, error } = await supabase
    .from('bouquets')
    .select('image_url, items, note, bg_color, from_name, to_name')
    .eq('slug', slug)
    .single()

  if (error) {
    return { error: error.message }
  }

  return data as BouquetData
}

// Public bouquet data for gallery
export interface PublicBouquet {
  slug: string
  image_url: string | null
  items: MediaItem[]
  created_at: string
}

// Load all public bouquets for gallery (only those with is_gallery = true)
export async function loadAllBouquets(): Promise<PublicBouquet[] | { error: string }> {
  if (!supabase) return NOT_CONFIGURED

  const { data, error } = await supabase
    .from('bouquets')
    .select('slug, image_url, items, created_at')
    .eq('is_gallery', true)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return data.map(row => ({ ...row, items: row.items || [] }) as PublicBouquet)
}
