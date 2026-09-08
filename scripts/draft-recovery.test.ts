import { afterEach, describe, expect, test } from "bun:test";
import { readDraft, writeDraft, type BouquetDraft } from "../src/lib/drafts";
const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
afterEach(() => {
  if (original) Object.defineProperty(globalThis, "localStorage", original);
  else Reflect.deleteProperty(globalThis, "localStorage");
});
const draft: BouquetDraft = {
  version: 1,
  items: [
    {
      id: "one",
      type: "link",
      mediaId: "https://example.com",
      x: 50,
      y: 50,
      scale: 0.8,
      rotation: 0,
    },
  ],
  flowerImage: "flowers",
  bgColor: "#ffffff",
  fromName: "Test",
  toName: "",
  note: "A note",
  isGallery: false,
};
function storage() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
  return values;
}
describe("draft recovery", () => {
  test("persists links, layout, note and gallery preference across reads", () => {
    storage();
    expect(writeDraft("new", draft)).toBe(true);
    expect(readDraft("new")).toEqual(draft);
    expect(readDraft("different-bouquet")).toBe(null);
  });
  test("ignores corrupt and unknown-version drafts", () => {
    const values = storage();
    for (const bad of [
      "{",
      '{"version":99}',
      JSON.stringify({ ...draft, items: [null] }),
      JSON.stringify({ ...draft, items: [{ ...draft.items[0], scale: -1 }] }),
    ]) {
      values.set("new", bad);
      expect(readDraft("new")).toBe(null);
    }
  });
  test("unavailable storage does not crash editing or claim successful persistence", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Storage blocked");
      },
    });
    expect(readDraft("new")).toBe(null);
    expect(writeDraft("new", draft)).toBe(false);
  });
});
