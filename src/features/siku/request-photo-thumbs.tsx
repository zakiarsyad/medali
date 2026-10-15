"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import shared from "@/ui/data-screen.module.css";
import modal from "@/ui/modal-dialog.module.css";
import { photoAddress } from "./request-photo";
import type { RequestPhoto } from "./request-photos";
import styles from "./siku.module.css";

export const PHOTO_NOT_KEPT = "Foto belum tersedia";

/**
 * One photo large in a box over the page. "Tutup", Escape and a press
 * outside the box all close it. The address of the page does not change,
 * so nothing typed on the page is lost.
 */
function PhotoDialog({
  photoId,
  label,
  onClose,
}: {
  photoId: string;
  label: string;
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
      aria-label={label}
      onClose={onClose}
      onClick={closeWhenOutside}
    >
      <div className={modal.box}>
        <button
          type="button"
          className={`${shared.quiet} ${modal.close}`}
          onClick={() => dialog.current?.close()}
        >
          Tutup
        </button>
        <h2 className={shared.heading}>{label}</h2>
        {/* biome-ignore lint/performance/noImgElement: the photo is private and is given only after the server has checked who asks, which the image optimiser of the server cannot pass. */}
        <img
          src={photoAddress(photoId, false)}
          alt={label}
          className={styles.largePhoto}
        />
      </div>
    </dialog>
  );
}

/**
 * The proof photos of a request, each small, loaded only once it comes
 * into view. A press on one opens it large in the page. A photo whose
 * picture is not kept says so.
 */
export function RequestPhotoThumbs({
  photos,
}: {
  photos: readonly RequestPhoto[];
}) {
  const [opened, setOpened] = useState<number | null>(null);
  const shown = opened === null ? undefined : photos[opened];
  return (
    <>
      <ul className={styles.thumbs}>
        {photos.map((photo, at) => (
          <li key={photo.id} className={styles.thumb}>
            {photo.isKept ? (
              <button
                type="button"
                className={styles.thumbButton}
                aria-label={`Lihat foto bukti ${at + 1}`}
                onClick={() => setOpened(at)}
              >
                {/* biome-ignore lint/performance/noImgElement: the photo is private and is given only after the server has checked who asks, which the image optimiser of the server cannot pass. */}
                <img
                  src={photoAddress(photo.id, true)}
                  alt={`Foto bukti ${at + 1}`}
                  loading="lazy"
                />
              </button>
            ) : (
              <span className={styles.missingPhoto}>
                {photo.removed ?? PHOTO_NOT_KEPT}
              </span>
            )}
          </li>
        ))}
      </ul>
      {shown !== undefined && opened !== null && (
        <PhotoDialog
          key={shown.id}
          photoId={shown.id}
          label={`Foto bukti ${opened + 1}`}
          onClose={() => setOpened(null)}
        />
      )}
    </>
  );
}
