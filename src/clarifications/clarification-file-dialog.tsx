"use client";

import { type MouseEvent, useEffect, useRef } from "react";
import shared from "@/ui/data-screen.module.css";
import modal from "@/ui/modal-dialog.module.css";
import styles from "./clarification-file-dialog.module.css";
import { type ClarificationFile, PDF_NOT_SHOWN } from "./shown-file";

/** The file itself: a PDF in a frame, or the picture. */
function Shown({
  file,
  address,
}: {
  file: ClarificationFile;
  address: string;
}) {
  if (!file.isPdf) {
    return (
      // biome-ignore lint/performance/noImgElement: the file is private and is given only after the server has checked who asks, which the image optimiser of the server cannot pass.
      <img src={address} alt={file.name} className={styles.filePicture} />
    );
  }
  return (
    <>
      <iframe src={address} title={file.name} className={styles.fileFrame} />
      <p className={shared.detail}>{PDF_NOT_SHOWN}</p>
    </>
  );
}

/**
 * The file of a clarification in a box over the screen, which a press on
 * its name opened: what it is and how large, "Unduh" and "Tutup", and
 * the file itself. "Tutup", Escape and a press outside the box all close
 * it, and the browser then puts the keyboard back on the name pressed.
 * The address of the page does not change, so the cards keep what was
 * decided on them. `addressOf` gives where the server answers with the
 * file, to be shown inside the page or downloaded.
 */
export function ClarificationFileDialog({
  file,
  addressOf,
  onClose,
}: {
  file: ClarificationFile;
  addressOf: (isShown: boolean) => string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  // Only `showModal` puts a dialog over the page and gives it Escape: the
  // `open` attribute alone would show it as a plain part of the page.
  useEffect(() => {
    const box = dialog.current;
    if (box && !box.open) box.showModal();
  }, []);

  // A press on the dimmed page around the box lands on the dialog itself.
  function closeWhenOutside(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) event.currentTarget.close();
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the keyboard closes a dialog with Escape, which the browser handles and reports through onClose.
    <dialog
      ref={dialog}
      className={modal.dialog}
      aria-label="Lampiran klarifikasi"
      onClose={onClose}
      onClick={closeWhenOutside}
    >
      <div className={modal.box}>
        <div className={styles.fileHead}>
          <div>
            <h2 className={shared.heading}>{file.name}</h2>
            <p className={shared.detail}>{file.facts}</p>
          </div>
          <div className={shared.actions}>
            <a href={addressOf(false)} className={shared.quiet}>
              Unduh
            </a>
            <button
              type="button"
              className={shared.quiet}
              onClick={() => dialog.current?.close()}
            >
              Tutup
            </button>
          </div>
        </div>
        <Shown file={file} address={addressOf(true)} />
      </div>
    </dialog>
  );
}
