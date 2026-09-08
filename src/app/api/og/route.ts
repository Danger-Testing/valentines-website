import { fetchPreviewHtml, PreviewError } from "@/lib/server/preview";

export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  try {
    const html = await fetchPreviewHtml(url);

    // Extract OG image
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i)
      || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);

    // Extract OG title
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
      || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);

    return NextResponse.json({
      image: ogImageMatch?.[1] || null,
      title: ogTitleMatch?.[1] || null,
    });
  } catch (error) {
    if (error instanceof PreviewError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
