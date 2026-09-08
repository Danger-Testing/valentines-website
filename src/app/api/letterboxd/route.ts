import { fetchPreviewHtml, PreviewError } from "@/lib/server/preview";

export const runtime = "nodejs";
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  try {
    const html = await fetchPreviewHtml(url, true);

    // Extract OG meta tags
    const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1];
    const ogDescription = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1];

    // Extract poster image (higher quality)
    const posterMatch = html.match(/data-film-poster="([^"]+)"/);
    const poster = posterMatch ? `https://a.ltrbxd.com/resized/${posterMatch[1]}` : ogImage;

    // Check if it's a review/comment
    const isReview = url.includes('/film/') && url.split('/').length > 5;

    // Extract rating if present
    const ratingMatch = html.match(/rated it (\d(?:\.\d)?)/i) || html.match(/class="rating rating-(\d+)"/);
    const rating = ratingMatch ? ratingMatch[1] : null;

    // Extract year
    const yearMatch = html.match(/\/films\/year\/(\d{4})\//);
    const year = yearMatch ? yearMatch[1] : null;

    return NextResponse.json({
      image: poster || ogImage,
      title: ogTitle?.replace(' | Letterboxd', '').replace('&#x27;', "'") || 'Unknown',
      description: ogDescription,
      rating,
      year,
      isReview,
    });
  } catch (error) {
    if (error instanceof PreviewError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Letterboxd fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
