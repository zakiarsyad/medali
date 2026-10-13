"use client";

import { unstable_rethrow } from "next/navigation";
import { type ChangeEvent, useEffect, useState, useTransition } from "react";
import shared from "@/ui/data-screen.module.css";
import type { FormState } from "@/ui/form-message";
import { sendAttendancePhotoAction } from "./actions";
import styles from "./activities.module.css";
import {
  NOT_A_PICTURE,
  PHOTO_FILE_NAME,
  pickedPhotoFault,
} from "./attendance-photo";
import { shrinkPhoto } from "./shrink-photo";

/** Said when the photo did not reach the server, or no answer came back. */
export const SEND_FAILED =
  "Foto tidak terkirim. Periksa koneksi internet, lalu tekan Kirim presensi lagi.";

/** A picked photo, made smaller, with the address its preview is shown from. */
interface ReadyPhoto {
  blob: Blob;
  preview: string;
}

/** A way to pick a photo that looks like a button: the camera, or the files. */
function PhotoPick({
  label,
  className,
  camera,
  disabled,
  onPick,
}: {
  label: string;
  className: string | undefined;
  /** Whether a phone opens its front camera at once. */
  camera: boolean;
  disabled: boolean;
  onPick: (file: File) => void;
}) {
  function picked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Emptied so that picking the same file again is noticed.
    event.target.value = "";
    if (file) onPick(file);
  }

  return (
    <label className={className}>
      {label}
      <input
        type="file"
        accept="image/*"
        capture={camera ? "user" : undefined}
        className={shared.hidden}
        disabled={disabled}
        onChange={picked}
      />
    </label>
  );
}

/**
 * Takes or picks the attendance photo of one schedule, shows it, and
 * sends it. The photo is made smaller here before it is sent. What the
 * server answers goes to `onAnswer`; what is wrong with a picked file is
 * said here, as nothing was sent.
 */
export function PhotoSender({
  scheduleId,
  onAnswer,
  onCancel,
}: {
  scheduleId: string;
  onAnswer: (answer: FormState) => void;
  onCancel: () => void;
}) {
  const [photo, setPhoto] = useState<ReadyPhoto | null>(null);
  const [fault, setFault] = useState<string | null>(null);
  const [reading, startReading] = useTransition();
  const [sending, startSending] = useTransition();
  const busy = reading || sending;

  // The preview is kept by the browser until it is let go of.
  useEffect(() => {
    if (photo === null) return;
    return () => URL.revokeObjectURL(photo.preview);
  }, [photo]);

  function pick(file: File) {
    const wrong = pickedPhotoFault(file.type, file.size);
    if (wrong) return setFault(wrong);
    startReading(async () => {
      const blob = await shrinkPhoto(file);
      if (blob === null) return setFault(NOT_A_PICTURE);
      setFault(null);
      setPhoto({ blob, preview: URL.createObjectURL(blob) });
    });
  }

  function send(blob: Blob) {
    const form = new FormData();
    form.set("scheduleId", scheduleId);
    form.set("photo", blob, PHOTO_FILE_NAME);
    startSending(async () => {
      try {
        const sent = await sendAttendancePhotoAction(form);
        onAnswer(
          sent.ok
            ? { error: null, done: sent.value }
            : { error: sent.error, done: null },
        );
      } catch (error) {
        // An answer that sends the student elsewhere is not a failure.
        unstable_rethrow(error);
        onAnswer({ error: SEND_FAILED, done: null });
      }
    });
  }

  return (
    <div className={styles.sender}>
      <b>Foto kehadiran (gambar, maks. 8 MB)</b>
      {photo === null ? (
        <>
          <p className={styles.cardText}>
            Ambil atau pilih foto yang menunjukkan Anda hadir di kegiatan.
          </p>
          <div className={shared.actions}>
            <PhotoPick
              label="Ambil foto"
              className={shared.button}
              camera
              disabled={busy}
              onPick={pick}
            />
            <PhotoPick
              label="Pilih gambar"
              className={shared.quiet}
              camera={false}
              disabled={busy}
              onPick={pick}
            />
            <button type="button" className={shared.quiet} onClick={onCancel}>
              Batal
            </button>
          </div>
        </>
      ) : (
        <>
          {/* biome-ignore lint/performance/noImgElement: the picture exists only in this browser, where the image optimiser of the server cannot fetch it. */}
          <img
            src={photo.preview}
            alt="Pratinjau foto kehadiran"
            className={styles.preview}
          />
          <p className={styles.cardText}>Periksa foto, lalu kirim.</p>
          <div className={shared.actions}>
            <button
              type="button"
              className={shared.button}
              disabled={busy}
              onClick={() => send(photo.blob)}
            >
              {sending ? "Mengirim…" : "Kirim presensi"}
            </button>
            <button
              type="button"
              className={shared.quiet}
              disabled={busy}
              onClick={() => setPhoto(null)}
            >
              Ulangi
            </button>
            <button
              type="button"
              className={shared.quiet}
              disabled={busy}
              onClick={onCancel}
            >
              Batal
            </button>
          </div>
        </>
      )}
      {reading && (
        <p className={styles.cardText} role="status">
          Menyiapkan foto…
        </p>
      )}
      {fault && !reading && (
        <p className={shared.error} role="alert">
          {fault}
        </p>
      )}
    </div>
  );
}
