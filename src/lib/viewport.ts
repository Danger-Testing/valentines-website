// Ref callback that keeps a full-screen layer inside the part of the screen
// that is actually visible. Phones lay fixed elements out against the whole
// viewport, and the on-screen keyboard covers the bottom of it without
// resizing it, so anything sized to the viewport ends up behind the keyboard.
export function fitToVisualViewport(layer: HTMLElement | null) {
  const viewport = window.visualViewport;
  if (!layer || !viewport) return;

  const fit = () => {
    layer.style.top = `${viewport.offsetTop}px`;
    layer.style.height = `${viewport.height}px`;
  };
  fit();
  viewport.addEventListener("resize", fit);
  viewport.addEventListener("scroll", fit);

  return () => {
    viewport.removeEventListener("resize", fit);
    viewport.removeEventListener("scroll", fit);
  };
}
