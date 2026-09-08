"use client";

import { useEffect } from "react";

/** Keep dialogs inside the area above the software keyboard, including Safari. */
export function useDialogViewport(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Let intentional pinch zoom magnify and pan the page normally.
        if (viewport && Math.abs(viewport.scale - 1) > 0.05) return;
        root.style.setProperty(
          "--dialog-height",
          `${viewport?.height ?? window.innerHeight}px`,
        );
        root.style.setProperty("--dialog-top", `${viewport?.offsetTop ?? 0}px`);
      });
    };
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      root.style.removeProperty("--dialog-height");
      root.style.removeProperty("--dialog-top");
    };
  }, [open]);
}
