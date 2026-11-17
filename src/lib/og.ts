// Extract an Open Graph meta tag (e.g. "image", "title") from a page's HTML
export function ogTag(html: string, name: string): string | null {
  const property = `property="og:${name}"`;
  const match =
    html.match(new RegExp(`<meta[^>]*${property}[^>]*content="([^"]+)"`, "i")) ||
    html.match(new RegExp(`<meta[^>]*content="([^"]+)"[^>]*${property}`, "i"));
  return match?.[1] ?? null;
}
