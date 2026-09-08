import { lookup } from "node:dns";
import { get as httpGet, type RequestOptions } from "node:http";
import { get as httpsGet } from "node:https";
import { BlockList, isIP } from "node:net";

const blocked = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(address, prefix, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
for (const [address, prefix] of [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
] as const) {
  blocked.addSubnet(address, prefix, "ipv6");
}

export class PreviewError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, "ipv4");
  return (
    family === 6 &&
    globalV6.check(address, "ipv6") &&
    !blocked.check(address, "ipv6")
  );
}

export function previewUrl(raw: string, letterboxdOnly = false): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new PreviewError("Enter a valid web address.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port ||
    raw.length > 4096
  ) {
    throw new PreviewError("This address cannot be previewed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    isIP(host) ||
    !host.includes(".") ||
    /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host)
  ) {
    throw new PreviewError("Only public websites can be previewed.");
  }
  if (
    letterboxdOnly &&
    host !== "letterboxd.com" &&
    host !== "www.letterboxd.com"
  ) {
    throw new PreviewError("Enter a Letterboxd link.");
  }
  url.hash = "";
  return url;
}

// Validate the addresses in the connection's own lookup, preventing DNS rebinding.
const safeLookup: NonNullable<RequestOptions["lookup"]> = (
  hostname,
  options,
  callback,
) => {
  lookup(hostname, { all: true }, (error, addresses) => {
    if (error) return callback(error, "", 4);
    if (
      !addresses.length ||
      addresses.some(({ address }) => !isPublicAddress(address))
    ) {
      return callback(
        new PreviewError("Only public websites can be previewed."),
        "",
        4,
      );
    }
    if (options.all) callback(null, addresses);
    else callback(null, addresses[0].address, addresses[0].family);
  });
};

const MAX_BYTES = 512 * 1024;
const cache = new Map<string, { html: string; expires: number }>();

function requestPage(
  url: URL,
  signal: AbortSignal,
): Promise<{ html: string; redirect?: string }> {
  return new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsGet : httpGet)(
      url,
      {
        lookup: safeLookup,
        agent: false,
        signal,
        headers: {
          "User-Agent": "LinkBouquet/1.0",
          Accept: "text/html",
          "Accept-Encoding": "identity",
        },
      },
      (response) => {
        if (
          [301, 302, 303, 307, 308].includes(response.statusCode ?? 0) &&
          response.headers.location
        ) {
          response.destroy();
          resolve({ html: "", redirect: response.headers.location });
          return;
        }
        if ((response.statusCode ?? 500) >= 400) {
          response.destroy();
          reject(new PreviewError("This website is unavailable.", 502));
          return;
        }
        if (
          !/^(text\/html|application\/xhtml\+xml)(?:;|$)/i.test(
            response.headers["content-type"] ?? "",
          )
        ) {
          response.destroy();
          reject(new PreviewError("This address is not a web page."));
          return;
        }
        let size = 0;
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            response.destroy();
            reject(new PreviewError("This page is too large to preview.", 413));
          } else chunks.push(chunk);
        });
        response.on("end", () =>
          resolve({ html: Buffer.concat(chunks).toString("utf8") }),
        );
        response.on("error", reject);
      },
    );
    request.on("error", reject);
  });
}

export async function fetchPreviewHtml(
  raw: string,
  letterboxdOnly = false,
): Promise<string> {
  let url = previewUrl(raw, letterboxdOnly);
  const key = `${letterboxdOnly}:${url.href}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.html;
  const signal = AbortSignal.timeout(8000);
  for (let redirects = 0; redirects <= 3; redirects++) {
    const result = await requestPage(url, signal);
    if (result.redirect) {
      url = previewUrl(new URL(result.redirect, url).href, letterboxdOnly);
      continue;
    }
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(key, { html: result.html, expires: Date.now() + 300_000 });
    return result.html;
  }
  throw new PreviewError("This website redirects too many times.");
}
