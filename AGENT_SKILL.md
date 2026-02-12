# Link Bouquet - AI Agent Skill

This document describes how an AI agent can programmatically create a curated link bouquet and return a shareable URL.

## Quick Start

To create a bouquet, make a POST request to the Supabase REST API:

```bash
curl -X POST "https://thutucxsmfvtteafbndw.supabase.co/rest/v1/bouquets" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodXR1Y3hzbWZ2dHRlYWZibmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTA3MDEsImV4cCI6MjA4NjM4NjcwMX0.OhJ8v3xGjAg4ZfkfS_oKxGDzob7N7pIda53cDzBMCGc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodXR1Y3hzbWZ2dHRlYWZibmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTA3MDEsImV4cCI6MjA4NjM4NjcwMX0.OhJ8v3xGjAg4ZfkfS_oKxGDzob7N7pIda53cDzBMCGc" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "slug": "sweet-rose-1234",
    "image_url": "/flowers.png",
    "paths": [],
    "items": [...],
    "note": "Happy Valentines Day!",
    "bg_color": "#F77196"
  }'
```

The shareable URL will be: `https://linkbouquet.com?b={slug}`

---

## Data Schema

### Bouquet Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | Yes | Unique identifier for the bouquet URL (e.g., "sweet-rose-1234") |
| `image_url` | string | Yes | The flower image: `/flowers.png`, `/flowers2.png`, or `"ascii"` |
| `paths` | array | Yes | Always set to `[]` (legacy field) |
| `items` | MediaItem[] | Yes | Array of media items to display |
| `note` | string | No | Personal note shown when unwrapping the bouquet |
| `bg_color` | string | No | Background color as hex (default: `#ffffff`) |

### MediaItem Object

Each item in the `items` array:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID (use UUID format) |
| `type` | string | Media type (see supported types below) |
| `mediaId` | string | The extracted ID or URL for the media |
| `x` | number | Horizontal position (0-100, percentage from left) |
| `y` | number | Vertical position (0-100, percentage from top) |
| `rotation` | number | Rotation in degrees (typically -30 to 30) |
| `scale` | number | Size multiplier (0.3 to 3.0, default 0.8) |

---

## Supported Media Types

### YouTube
- **Type:** `"youtube"`
- **mediaId:** Video ID (e.g., `"dQw4w9WgXcQ"`)
- **URL patterns:**
  - `youtube.com/watch?v=VIDEO_ID`
  - `youtu.be/VIDEO_ID`
  - `youtube.com/shorts/VIDEO_ID`

### Spotify
- **Type:** `"spotify"`
- **mediaId:** Format: `"track/TRACK_ID"`, `"album/ALBUM_ID"`, or `"playlist/PLAYLIST_ID"`
- **URL pattern:** `open.spotify.com/track|album|playlist/ID`

### Substack
- **Type:** `"substack"`
- **mediaId:** Full URL (e.g., `"https://www.henrikkarlsson.xyz/p/looking-for-alice"`)
- **URL pattern:** `*.substack.com/p/article-slug` or custom domains

### Letterboxd
- **Type:** `"letterboxd"`
- **mediaId:** Full URL (e.g., `"https://letterboxd.com/film/her"`)
- **URL pattern:** `letterboxd.com/film/FILM_SLUG`

### Twitter/X
- **Type:** `"twitter"`
- **mediaId:** Tweet ID (e.g., `"1234567890123456789"`)
- **URL pattern:** `twitter.com/USER/status/TWEET_ID` or `x.com/USER/status/TWEET_ID`

### Instagram
- **Type:** `"instagram"`
- **mediaId:** Post/Reel ID (e.g., `"ABC123xyz"`)
- **URL pattern:** `instagram.com/reel/ID` or `instagram.com/p/ID`

---

## Flower Image Options

| Value | Description |
|-------|-------------|
| `/flowers.png` | Colorful illustrated bouquet (default) |
| `/flowers2.png` | Alternative illustrated bouquet |
| `"ascii"` | ASCII art flower |

---

## Background Color Presets

| Color | Hex | Description |
|-------|-----|-------------|
| White | `#ffffff` | Default clean background |
| Pink | `#F77196` | Romantic pink |
| Red | `#C2021B` | Valentine's red |

Any valid hex color is accepted.

---

## Positioning Guide

The canvas has a 3:4 aspect ratio. Position items using percentages:

```
(0,0) ────────────────────── (100,0)
  │                              │
  │     (15,25)      (85,25)     │
  │                              │
  │  (10,55)          (90,55)    │
  │                              │
  │     (20,80)      (80,80)     │
  │                              │
(0,100) ────────────────────(100,100)
```

**Recommended positions for balanced layouts:**
- Top corners: `(15, 25)` and `(85, 25)`
- Middle sides: `(10, 55)` and `(90, 55)`
- Bottom corners: `(20, 80)` and `(80, 80)`
- Top center: `(50, 15)`
- Bottom center: `(50, 85)`

---

## Slug Generation

Generate a unique slug in this format: `{adjective}-{noun}-{4-digit-number}`

**Adjectives:** sweet, lovely, dear, precious, tender, gentle, warm, bright, rosy, golden

**Nouns:** heart, rose, bloom, petal, garden, dream, wish, kiss, hug, love

**Example:** `tender-bloom-4829`

---

## Complete Example

Create a bouquet with a YouTube video, Spotify track, and Letterboxd film:

```json
{
  "slug": "lovely-heart-7392",
  "image_url": "/flowers.png",
  "paths": [],
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "youtube",
      "mediaId": "dQw4w9WgXcQ",
      "x": 15,
      "y": 25,
      "rotation": -5,
      "scale": 0.8
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "type": "spotify",
      "mediaId": "track/4uLU6hMCjMI75M1A2tKUQC",
      "x": 85,
      "y": 55,
      "rotation": 5,
      "scale": 0.7
    },
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "type": "letterboxd",
      "mediaId": "https://letterboxd.com/film/her",
      "x": 20,
      "y": 80,
      "rotation": 0,
      "scale": 0.75
    }
  ],
  "note": "Dear love,\n\nHere are some things that remind me of you.\n\nForever yours",
  "bg_color": "#F77196"
}
```

**Result URL:** `https://linkbouquet.com?b=lovely-heart-7392`

---

## API Response

On success with `Prefer: return=representation`, you'll receive the created row:

```json
[
  {
    "id": 123,
    "slug": "lovely-heart-7392",
    "image_url": "/flowers.png",
    "paths": [],
    "items": [...],
    "note": "...",
    "bg_color": "#F77196",
    "created_at": "2025-02-12T..."
  }
]
```

---

## Error Handling

- **Slug collision (23505):** Generate a new slug and retry
- **Invalid media type:** Ensure type is one of the supported values
- **Missing required fields:** Include slug, image_url, paths, and items

---

## Agent Workflow Summary

1. **Gather inputs:** Ask user for links, note, flower preference, and background color
2. **Parse URLs:** Extract media IDs from provided URLs
3. **Generate slug:** Create unique slug like `gentle-petal-5821`
4. **Build payload:** Construct the bouquet JSON with positioned items
5. **POST to API:** Send to Supabase REST endpoint
6. **Return URL:** Give user `https://linkbouquet.com?b={slug}`
