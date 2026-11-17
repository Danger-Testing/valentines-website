import { NextRequest, NextResponse } from 'next/server';
import { ogTag } from '@/lib/og';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkBouquet/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    const html = await response.text();

    // Prefer the poster image (higher quality) over the OG image
    const posterMatch = html.match(/data-film-poster="([^"]+)"/);
    const image = posterMatch
      ? `https://a.ltrbxd.com/resized/${posterMatch[1]}`
      : ogTag(html, 'image');

    // Extract rating if present
    const ratingMatch = html.match(/rated it (\d(?:\.\d)?)/i) || html.match(/class="rating rating-(\d+)"/);

    // Extract year
    const yearMatch = html.match(/\/films\/year\/(\d{4})\//);

    return NextResponse.json({
      image,
      title: ogTag(html, 'title')?.replace(' | Letterboxd', '').replace('&#x27;', "'") || 'Unknown',
      rating: ratingMatch?.[1] ?? null,
      year: yearMatch?.[1] ?? null,
    });
  } catch (error) {
    console.error('Letterboxd fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
