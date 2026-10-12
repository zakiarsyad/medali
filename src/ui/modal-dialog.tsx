"use client";

import { useRouter } from "next/navigation";
import { type MouseEvent, type ReactNode, useEffect, useRef } from "react";
import shared from "./data-screen.module.css";
import styles from "./modal-dialog.module.css";

/**
 * A box over the screen, which the address of the page opens. "Tutup",
 * Escape and a press outside the box all close it by going to the address
 * of the screen without the box.
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
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  // Only `showModal` puts a dialog over the page and gives it Escape: the
  // `open` attribute alone would show it as a plain part of the page.
  useEffect(() => {
    const box = dialog.current;
    if (box && !box.open) box.showModal();
  }, []);

  function leave() {
    router.replace(closeAddress, { scroll: false });
  }

  // A press on the dimmed page around the box lands on the dialog itself.
  function closeWhenOutside(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) event.currentTarget.close();
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the keyboard closes a dialog with Escape, which the browser handles and reports through onClose.
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label={label}
      onClose={leave}
      onClick={closeWhenOutside}
    >
      <div className={styles.box}>
        <button
          type="button"
          className={`${shared.quiet} ${styles.close}`}
          onClick={() => dialog.current?.close()}
        >
          Tutup
        </button>
        {children}
      </div>
    </dialog>
  );
}
