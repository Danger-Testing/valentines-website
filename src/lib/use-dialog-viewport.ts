"use client";

import { useEffect } from "react";
import { observeDialogViewport } from "./dialog-viewport";

/** Keep dialogs inside the area above the software keyboard, including Safari. */
export function useDialogViewport(open: boolean) {
  useEffect(() => {
    if (!open) return;
    return observeDialogViewport(window, document.documentElement.style);
  }, [open]);
}
