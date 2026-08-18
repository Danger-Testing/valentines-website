import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(path.join(root, "src/app/HomeClient.tsx"), "utf8");

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
    expect(source).toContain("window.location.href = `?b=${result.slug}`;");
  });
});
