// Disposable Supabase-shaped service for browser verification. Never contacts production.
import { createServer } from "node:http";
const rows = Array.from({ length: 145 }, (_, index) => ({
  slug: `fixture-bouquet-${String(index).padStart(3, "0")}`,
  image_url: "/flowers.png",
  paths: [],
  items: [
    {
      id: `fixture-link-${index}`,
      type: "link",
      mediaId: "https://example.com",
      x: 50,
      y: 50,
      rotation: 0,
      scale: 0.8,
    },
  ],
  note: "A test bouquet",
  from_name: "Test sender",
  to_name: "Test recipient",
  bg_color: "#ffffff",
  is_gallery: true,
  created_at: new Date(Date.UTC(2026, 8, 8, 0, 0, 145 - index)).toISOString(),
}));
let failNext = false;
const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");
  if (req.method === "OPTIONS") {
    res.end();
    return;
  }
  const url = new URL(req.url, "http://localhost:4110");
  if (url.pathname === "/fail-next") {
    failNext = true;
    res.end("{}");
    return;
  }
  if (failNext) {
    failNext = false;
    res.statusCode = 503;
    res.end(JSON.stringify({ message: "Test outage" }));
    return;
  }
  const body =
    req.method === "POST"
      ? JSON.parse(
          (await Array.fromAsync(req).then((chunks) =>
            Buffer.concat(chunks).toString(),
          )) || "{}",
        )
      : null;
  if (url.pathname === "/rest/v1/rpc/get_bouquet_by_slug") {
    res.end(
      JSON.stringify(
        rows.find((row) => row.slug === body.bouquet_slug) ?? null,
      ),
    );
    return;
  }
  if (url.pathname !== "/rest/v1/bouquets") {
    res.statusCode = 404;
    res.end("{}");
    return;
  }
  if (req.method === "POST") {
    rows.unshift({ ...body, created_at: new Date().toISOString() });
    res.statusCode = 201;
    res.end();
    return;
  }
  if (url.searchParams.has("slug")) {
    res.end(
      JSON.stringify(
        rows.find(
          (row) => row.slug === url.searchParams.get("slug").replace("eq.", ""),
        ) ?? null,
      ),
    );
    return;
  }
  const offset = Number(url.searchParams.get("offset") || 0);
  const limit = Number(url.searchParams.get("limit") || 121);
  res.end(
    JSON.stringify(
      rows.filter((row) => row.is_gallery).slice(offset, offset + limit),
    ),
  );
});
server.listen(4110, "127.0.0.1", () =>
  console.log("Disposable bouquet fixtures ready on http://localhost:4110"),
);
