import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(path.join(root, "src/app/HomeClient.tsx"), "utf8");
const layout = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");

describe("Appdrop output handoff", () => {
  test("waits for the private save before exposing its URL", () => {
    const handoffStart = source.indexOf("async function saveBouquetToAppdrop(");
    const handoffEnd = source.indexOf("function Home()", handoffStart);
    const handoff = source.slice(handoffStart, handoffEnd);

    expect(source).toContain("setCurrentOutput?: (output:");
    expect(handoff).toContain(
      "const savedOutput = await window.appdrop.saveOutput({",
    );
    expect(handoff).toContain(
      "await window.appdrop.setCurrentOutput({ id: outputId });",
    );
    expect(handoff.indexOf("await window.appdrop.saveOutput(")).toBeLessThan(
      handoff.indexOf("await window.appdrop.setCurrentOutput("),
    );
    expect(handoff).toContain("return savedOutput;");
  });

  test("keeps URL exposure optional so the saved chat card still wins", () => {
    expect(source).toContain(
      "if (outputId && window.appdrop.setCurrentOutput)",
    );
    expect(source).toContain('console.info("appdrop: output URL handoff skipped"');
    expect(source).toContain(
      "const isAppdropEmbedded = isRunningInAppdropFrame();",
    );
    expect(source).toContain('window.name.startsWith("appdrop-world:")');
    expect(source).toContain("if (!isAppdropEmbedded)");
    expect(source).toContain("window.location.href = `?b=${result.slug}`;");
  });

  test("loads the Appdrop bridge before interactive code runs", () => {
    expect(layout).toContain(
      'src="https://www.appdrop.com/appdrop-sdk.js"',
    );
    expect(layout).toContain('from "next/script"');
    expect(layout).toContain('strategy="beforeInteractive"');
  });

  test("offers a clipboard fallback after an embedded save", () => {
    expect(source).toContain("Saved and ready to share in chat");
    expect(source).toContain("await navigator.clipboard.writeText(shareUrl);");
    expect(source).toContain("Bouquet link copied to clipboard");
  });
});
