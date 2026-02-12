# Link Bouquet - AI Agent Skill

Create a curated link bouquet and return a shareable URL.

## API Endpoint

```
POST https://thutucxsmfvtteafbndw.supabase.co/rest/v1/bouquets
```

## Headers

```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRodXR1Y3hzbWZ2dHRlYWZibmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MTA3MDEsImV4cCI6MjA4NjM4NjcwMX0.OhJ8v3xGjAg4ZfkfS_oKxGDzob7N7pIda53cDzBMCGc
Content-Type: application/json
```

## Request Body

```json
{
  "slug": "sweet-rose-1234",
  "image_url": "/flowers.png",
  "paths": [],
  "items": [
    {
      "id": "1",
      "type": "youtube",
      "mediaId": "dQw4w9WgXcQ",
      "x": 15,
      "y": 25,
      "rotation": 0,
      "scale": 0.8
    }
  ],
  "note": "Happy Valentines Day!",
  "bg_color": "#F77196"
}
```

## Return to User

After successful POST, give user this link:
```
https://linkbouquet.com?b={slug}
```

---

## Field Reference

### slug (required)
Unique ID for the bouquet URL. Format: `{adjective}-{noun}-{4digits}`

Adjectives: sweet, lovely, dear, precious, tender, gentle, warm, bright, rosy, golden
Nouns: heart, rose, bloom, petal, garden, dream, wish, kiss, hug, love

Example: `tender-bloom-4829`

### image_url (required)
The flower image to display:
- `/flowers.png` - Colorful bouquet (default)
- `/flowers2.png` - Alternative bouquet
- `ascii` - ASCII art flower

### paths (required)
Always set to `[]`

### items (required)
Array of media items. Each item:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique ID (just use "1", "2", "3", etc.) |
| type | string | youtube, spotify, letterboxd, substack, twitter, instagram |
| mediaId | string | The media identifier (see below) |
| x | number | Position 0-100 (left to right) |
| y | number | Position 0-100 (top to bottom) |
| rotation | number | Rotation in degrees (-30 to 30) |
| scale | number | Size 0.3 to 3.0 (default 0.8) |

### note (optional)
Personal message shown when recipient opens the bouquet.

### bg_color (optional)
Background color as hex:
- `#ffffff` - White (default)
- `#F77196` - Pink
- `#C2021B` - Red
- Any hex color

---

## Media Types & IDs

### YouTube
- Type: `youtube`
- mediaId: Video ID
- Extract from: `youtube.com/watch?v=VIDEO_ID` or `youtu.be/VIDEO_ID`

### Spotify
- Type: `spotify`
- mediaId: `track/TRACK_ID`, `album/ALBUM_ID`, or `playlist/PLAYLIST_ID`
- Extract from: `open.spotify.com/track/TRACK_ID`

### Letterboxd
- Type: `letterboxd`
- mediaId: Full URL
- Example: `https://letterboxd.com/film/her`

### Substack
- Type: `substack`
- mediaId: Full article URL
- Example: `https://example.substack.com/p/article-name`

### Twitter/X
- Type: `twitter`
- mediaId: Tweet ID
- Extract from: `x.com/user/status/TWEET_ID`

### Instagram
- Type: `instagram`
- mediaId: Post/Reel ID
- Extract from: `instagram.com/reel/POST_ID`

---

## Recommended Positions

For a balanced layout, use these (x, y) positions:

```
Top left:     (15, 25)
Top right:    (85, 25)
Middle left:  (10, 55)
Middle right: (90, 55)
Bottom left:  (20, 80)
Bottom right: (80, 80)
Top center:   (50, 15)
Bottom center:(50, 85)
```

---

## Complete Example

User wants: a YouTube video, a Spotify song, and a Letterboxd film with a love note on pink background.

```json
{
  "slug": "lovely-heart-7392",
  "image_url": "/flowers.png",
  "paths": [],
  "items": [
    {
      "id": "1",
      "type": "youtube",
      "mediaId": "dQw4w9WgXcQ",
      "x": 15,
      "y": 25,
      "rotation": -5,
      "scale": 0.8
    },
    {
      "id": "2",
      "type": "spotify",
      "mediaId": "track/4uLU6hMCjMI75M1A2tKUQC",
      "x": 85,
      "y": 55,
      "rotation": 5,
      "scale": 0.7
    },
    {
      "id": "3",
      "type": "letterboxd",
      "mediaId": "https://letterboxd.com/film/her",
      "x": 20,
      "y": 80,
      "rotation": 0,
      "scale": 0.75
    }
  ],
  "note": "Dear love,\n\nThese remind me of you.\n\nForever yours",
  "bg_color": "#F77196"
}
```

**Return to user:** `https://linkbouquet.com?b=lovely-heart-7392`
