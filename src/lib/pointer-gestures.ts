export type PointerPosition = {
  pointerId: number;
  clientX: number;
  clientY: number;
};
export type Camera = { x: number; y: number; zoom: number };
const DRAG_THRESHOLD = 6;

export class PointerDrag {
  moved = false;
  active = true;
  constructor(private readonly start: PointerPosition) {}
  move(pointer: PointerPosition) {
    if (!this.active || pointer.pointerId !== this.start.pointerId) return null;
    const x = pointer.clientX - this.start.clientX;
    const y = pointer.clientY - this.start.clientY;
    if (!this.moved && Math.hypot(x, y) < DRAG_THRESHOLD) return null;
    const started = !this.moved;
    this.moved = true;
    return { x, y, started };
  }
  end(pointerId: number) {
    if (!this.active || pointerId !== this.start.pointerId) return null;
    this.active = false;
    return { moved: this.moved };
  }
}

/** One-finger pan and two-finger zoom anchored to the fingers' midpoint. */
export class PanZoomGesture {
  private pointers = new Map<number, PointerPosition>();
  private anchor = { x: 0, y: 0, distance: 0 };
  private base: Camera = { x: 0, y: 0, zoom: 1 };
  private camera: Camera = this.base;
  private center = { x: 0, y: 0 };
  moved = false;
  get active() {
    return this.pointers.size > 0;
  }
  private geometry() {
    const [a, b] = [...this.pointers.values()];
    return b
      ? {
          x: (a.clientX + b.clientX) / 2,
          y: (a.clientY + b.clientY) / 2,
          distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        }
      : { x: a.clientX, y: a.clientY, distance: 0 };
  }
  begin(
    pointer: PointerPosition,
    camera: Camera,
    center: { x: number; y: number },
  ) {
    if (this.pointers.size >= 2) return false;
    if (!this.active) {
      this.camera = camera;
      this.moved = false;
    }
    this.center = center;
    this.pointers.set(pointer.pointerId, pointer);
    this.base = this.camera;
    this.anchor = this.geometry();
    // A two-finger gesture must never activate a gallery link.
    if (this.pointers.size === 2) this.moved = true;
    return true;
  }
  move(pointer: PointerPosition) {
    if (!this.pointers.has(pointer.pointerId)) return null;
    this.pointers.set(pointer.pointerId, pointer);
    const point = this.geometry();
    if (
      !this.moved &&
      Math.hypot(point.x - this.anchor.x, point.y - this.anchor.y) <
        DRAG_THRESHOLD
    )
      return null;
    this.moved = true;
    const zoom =
      this.anchor.distance > 0 && point.distance > 0
        ? Math.max(
            0.16,
            Math.min(
              2.4,
              (this.base.zoom * point.distance) / this.anchor.distance,
            ),
          )
        : this.base.zoom;
    this.camera = {
      zoom,
      x:
        this.base.x +
        (point.x - this.center.x) / zoom -
        (this.anchor.x - this.center.x) / this.base.zoom,
      y:
        this.base.y +
        (point.y - this.center.y) / zoom -
        (this.anchor.y - this.center.y) / this.base.zoom,
    };
    return this.camera;
  }
  end(pointerId: number) {
    if (!this.pointers.delete(pointerId)) return false;
    if (this.active) {
      this.base = this.camera;
      this.anchor = this.geometry();
    }
    return this.moved;
  }
  cancel() {
    this.pointers.clear();
  }
}
