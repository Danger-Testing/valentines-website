import { describe, expect, test } from "bun:test";
import { observeDialogViewport } from "../src/lib/dialog-viewport";

function browser(withVisualViewport = true) {
  const viewport = Object.assign(new EventTarget(), {
    width: 390,
    height: 844,
    offsetTop: 0,
    offsetLeft: 0,
    scale: 1,
  });
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  const target = Object.assign(new EventTarget(), {
    innerWidth: 390,
    innerHeight: 844,
    visualViewport: withVisualViewport ? viewport : null,
    requestAnimationFrame(callback: FrameRequestCallback) {
      frames.set(++nextFrame, callback);
      return nextFrame;
    },
    cancelAnimationFrame(id: number) {
      frames.delete(id);
    },
  });
  const values = new Map<string, string>();
  const stop = observeDialogViewport(target, {
    setProperty(property, value) {
      values.set(property, value ?? "");
    },
    removeProperty(property) {
      const previous = values.get(property) ?? "";
      values.delete(property);
      return previous;
    },
  });
  const flush = () => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(0));
  };
  return { target, viewport, values, stop, flush };
}

describe("mobile dialog viewport", () => {
  test("follows keyboard opening and dismissal without a layout viewport resize", () => {
    const b = browser();
    Object.assign(b.viewport, { height: 330, offsetTop: 90 });
    b.viewport.dispatchEvent(new Event("resize"));
    b.flush();
    expect(b.target.innerHeight).toBe(844);
    expect(b.values.get("--dialog-height")).toBe("330px");
    expect(b.values.get("--dialog-top")).toBe("90px");
    Object.assign(b.viewport, { height: 844, offsetTop: 0 });
    b.viewport.dispatchEvent(new Event("resize"));
    b.flush();
    expect(b.values.get("--dialog-height")).toBe("844px");
    expect(b.values.get("--dialog-top")).toBe("0px");
    b.stop();
  });

  test("keeps a zoomed, panned dialog inside the visible keyboard area", () => {
    const b = browser();
    Object.assign(b.viewport, {
      width: 260,
      height: 220,
      offsetTop: 160,
      offsetLeft: 50,
      scale: 1.5,
    });
    b.viewport.dispatchEvent(new Event("scroll"));
    b.flush();
    expect(b.values.get("--dialog-width")).toBe("260px");
    expect(b.values.get("--dialog-height")).toBe("220px");
    expect(b.values.get("--dialog-left")).toBe("50px");
    expect(b.values.get("--dialog-top")).toBe("160px");
    b.stop();
  });

  test("survives rotation's transient zero size and ignores events after closing", () => {
    const b = browser();
    b.viewport.height = 0;
    b.viewport.dispatchEvent(new Event("resize"));
    b.flush();
    expect(b.values.get("--dialog-height")).toBe("844px");
    Object.assign(b.viewport, { width: 844, height: 390 });
    b.viewport.dispatchEvent(new Event("resize"));
    b.stop();
    b.flush();
    b.viewport.dispatchEvent(new Event("scroll"));
    b.flush();
    expect(b.values.size).toBe(0);
  });

  test("falls back to the window when VisualViewport is unavailable", () => {
    const b = browser(false);
    b.target.innerHeight = 300;
    b.target.dispatchEvent(new Event("resize"));
    b.flush();
    expect(b.values.get("--dialog-height")).toBe("300px");
    expect(b.values.get("--dialog-width")).toBe("390px");
    b.stop();
  });
});
