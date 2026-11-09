"use client";

import {
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from "react";
import shared from "./data-screen.module.css";
import styles from "./modal-dialog.module.css";

/**
 * A box over the page, open from the start. "Tutup", Escape and a press
 * outside the box all close it, and `onClose` is told.
 */
export function DialogBox({
  label,
  onClose,
  dialogRef,
  children,
}: {
  /** What the box holds, for a screen reader. */
  label: string;
  onClose: () => void;
  /** Lets the holder close the box itself, such as after a save. */
  dialogRef?: RefObject<HTMLDialogElement | null>;
  children: ReactNode;
}) {
  const own = useRef<HTMLDialogElement>(null);
  const dialog = dialogRef ?? own;

  // Only `showModal` puts a dialog over the page and gives it Escape: the
  // `open` attribute alone would show it as a plain part of the page.
  useEffect(() => {
    const box = dialog.current;
    if (box && !box.open) box.showModal();
  }, [dialog]);

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
      onClose={onClose}
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
