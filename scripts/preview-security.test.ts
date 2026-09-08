import { describe, expect, test } from "bun:test";
import {
  isPublicAddress,
  previewUrl,
  fetchPreviewHtml,
} from "../src/lib/server/preview";

describe("preview destination protection", () => {
  test("rejects internal and non-global addresses, including mapped IPv6", () => {
    for (const ip of [
      "127.0.0.1",
      "0.0.0.0",
      "10.1.2.3",
      "100.64.0.1",
      "169.254.169.254",
      "172.31.1.1",
      "192.168.1.1",
      "224.0.0.1",
      "::1",
      "::ffff:127.0.0.1",
      "fc00::1",
      "fe80::1",
      "2001:db8::1",
      "2002:7f00:1::",
    ])
      expect(isPublicAddress(ip)).toBe(false);
    for (const ip of ["93.184.216.34", "8.8.8.8", "2606:4700:4700::1111"])
      expect(isPublicAddress(ip)).toBe(true);
  });
  test("rejects IP encodings, credentials, unsafe schemes and ports before networking", async () => {
    for (const url of [
      "http://127.1",
      "http://2130706433",
      "http://0x7f000001",
      "http://[::1]",
      "file:///etc/passwd",
      "http://localhost",
      "http://metadata.internal",
      "https://example.com:444/",
      "https://user:pass@example.com",
    ]) {
      await expect(fetchPreviewHtml(url)).rejects.toThrow();
    }
  });
  test("Letterboxd uses an exact host allowlist, including redirect targets", () => {
    expect(previewUrl("https://letterboxd.com/film/her/", true).hostname).toBe(
      "letterboxd.com",
    );
    expect(() =>
      previewUrl("https://letterboxd.com.evil.example/film/her/", true),
    ).toThrow();
    expect(() =>
      previewUrl(
        new URL("//localhost/admin", "https://letterboxd.com").href,
        true,
      ),
    ).toThrow();
    expect(() =>
      previewUrl("https://example.com/?url=letterboxd.com", true),
    ).toThrow();
  });
});
