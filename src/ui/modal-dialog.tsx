"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { DialogBox } from "./dialog-box";
import { closesByGoingBack, pressedBox } from "./pressed-box";

/**
 * A box over the screen, which the address of the page opens. "Tutup",
 * Escape and a press outside the box all close it. A box that a press on
 * the screen opened closes by going back, so the browser's history keeps
 * no entry of it; any other box closes by putting the address of the
 * screen without the box in its place.
 */
export function ModalDialog({
  label,
  closeAddress,
  children,
}: {
  /** What the box holds, for a screen reader. */
  label: string;
  /** The address of the screen without the box. */
  closeAddress: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function leave() {
    const shown = window.location.pathname + window.location.search;
    if (closesByGoingBack(pressedBox(), shown)) {
      router.back();
      return;
    }
    router.replace(closeAddress, { scroll: false });
  }

  return (
    <DialogBox label={label} onClose={leave}>
      {children}
    </DialogBox>
  );
}
