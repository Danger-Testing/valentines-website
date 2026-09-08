import { describe, expect, test } from "bun:test";
import { PointerDrag, PanZoomGesture } from "../src/lib/pointer-gestures";

const pointer = (pointerId: number, clientX: number, clientY: number) => ({
  pointerId,
  clientX,
  clientY,
});

describe("touch tap and drag", () => {
  test("finger jitter stays a tap and does not create a drag checkpoint", () => {
    const drag = new PointerDrag(pointer(1, 100, 100));
    expect(drag.move(pointer(1, 103, 102))).toBeNull();
    expect(drag.move(pointer(1, 99, 103))).toBeNull();
    expect(drag.end(1)).toEqual({ moved: false });
  });
  test("a drag starts once, suppresses its click, and the next tap works", () => {
    const drag = new PointerDrag(pointer(1, 100, 100));
    expect(drag.move(pointer(1, 110, 102))).toEqual({
      x: 10,
      y: 2,
      started: true,
    });
    expect(drag.move(pointer(1, 130, 110))).toEqual({
      x: 30,
      y: 10,
      started: false,
    });
    expect(drag.end(1)).toEqual({ moved: true });
    expect(new PointerDrag(pointer(2, 120, 120)).end(2)).toEqual({
      moved: false,
    });
  });
  test("other fingers cannot move the item and cancelled gestures stop updating", () => {
    const drag = new PointerDrag(pointer(1, 100, 100));
    expect(drag.move(pointer(2, 200, 200))).toBeNull();
    expect(drag.end(2)).toBeNull();
    drag.end(1);
    expect(drag.move(pointer(1, 200, 200))).toBeNull();
  });
});

describe("gallery touch gestures", () => {
  const center = { x: 195, y: 422 };
  test("a tap on a tile stays a tap; dragging from it pans by screen distance", () => {
    const gesture = new PanZoomGesture();
    gesture.begin(pointer(1, 100, 100), { x: 0, y: 0, zoom: 0.5 }, center);
    expect(gesture.move(pointer(1, 103, 101))).toBeNull();
    expect(gesture.end(1)).toBe(false);
    gesture.begin(pointer(2, 100, 100), { x: 0, y: 0, zoom: 0.5 }, center);
    expect(gesture.move(pointer(2, 150, 120))).toEqual({
      x: 100,
      y: 40,
      zoom: 0.5,
    });
    expect(gesture.end(2)).toBe(true);
  });
  test("pinch zoom keeps the same bouquet under the moving midpoint", () => {
    const gesture = new PanZoomGesture();
    const before = { x: 20, y: -30, zoom: 0.5 };
    gesture.begin(pointer(1, 100, 300), before, center);
    gesture.begin(pointer(2, 200, 300), before, center);
    const after = gesture.move(pointer(2, 300, 300))!;
    expect(after.zoom).toBe(1);
    expect((150 - center.x) / before.zoom - before.x).toBeCloseTo(
      (200 - center.x) / after.zoom - after.x,
    );
    expect((300 - center.y) / before.zoom - before.y).toBeCloseTo(
      (300 - center.y) / after.zoom - after.y,
    );
    expect(gesture.end(2)).toBe(true);
    // Lifting a finger must not snap the camera back to the pre-pinch position.
    expect(gesture.move(pointer(1, 100, 300))).toEqual(after);
    gesture.cancel();
    expect(gesture.move(pointer(1, 300, 400))).toBeNull();
  });
  test("zoom remains bounded and a fresh tap after pinch is not suppressed", () => {
    const gesture = new PanZoomGesture();
    gesture.begin(pointer(1, 0, 0), { x: 0, y: 0, zoom: 1 }, center);
    gesture.begin(pointer(2, 100, 0), { x: 0, y: 0, zoom: 1 }, center);
    expect(gesture.move(pointer(2, 1000, 0))?.zoom).toBe(2.4);
    expect(gesture.move(pointer(2, 1, 0))?.zoom).toBe(0.16);
    gesture.end(1);
    gesture.end(2);
    gesture.begin(pointer(3, 50, 50), { x: 0, y: 0, zoom: 1 }, center);
    expect(gesture.end(3)).toBe(false);
  });
});
