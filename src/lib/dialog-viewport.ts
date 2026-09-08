type ViewportSource = EventTarget & {
  width: number;
  height: number;
  offsetTop: number;
  offsetLeft: number;
};

type ViewportWindow = EventTarget & {
  innerWidth: number;
  innerHeight: number;
  visualViewport: ViewportSource | null;
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (id: number) => void;
};

/** Track the visible area, which can shrink without a window resize on iOS. */
export function observeDialogViewport(
  target: ViewportWindow,
  style: Pick<CSSStyleDeclaration, "setProperty" | "removeProperty">,
) {
  const viewport = target.visualViewport;
  const properties = [
    "--dialog-height",
    "--dialog-width",
    "--dialog-top",
    "--dialog-left",
  ];
  let frame = 0;
  const render = () => {
    const height = viewport?.height ?? target.innerHeight;
    const width = viewport?.width ?? target.innerWidth;
    // Some WebViews briefly report a zero viewport during rotation.
    if (height <= 0 || width <= 0) return;
    const values = [
      height,
      width,
      Math.max(0, viewport?.offsetTop ?? 0),
      Math.max(0, viewport?.offsetLeft ?? 0),
    ];
    properties.forEach((property, index) =>
      style.setProperty(property, `${values[index]}px`),
    );
  };
  const update = () => {
    target.cancelAnimationFrame(frame);
    frame = target.requestAnimationFrame(render);
  };
  render();
  viewport?.addEventListener("resize", update);
  viewport?.addEventListener("scroll", update);
  target.addEventListener("resize", update);
  target.addEventListener("pageshow", update);
  return () => {
    target.cancelAnimationFrame(frame);
    viewport?.removeEventListener("resize", update);
    viewport?.removeEventListener("scroll", update);
    target.removeEventListener("resize", update);
    target.removeEventListener("pageshow", update);
    properties.forEach((property) => style.removeProperty(property));
  };
}
