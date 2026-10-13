import type { ChangeEvent } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import type { UploadState } from "./photo-upload";

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
 * The upload of a card as it is drawn for one state: the two ways to
 * pick a photo, or the picked photo with "Kirim presensi" and "Ulangi",
 * and "Batal" in both. It keeps nothing itself, so it can be drawn and
 * pressed in a check.
 */
export function PhotoSenderView({
  state,
  onPick,
  onSend,
  onRedo,
  onCancel,
}: {
  state: UploadState;
  onPick: (file: File) => void;
  onSend: () => void;
  onRedo: () => void;
  onCancel: () => void;
}) {
  const { photo, fault, reading, sending } = state;
  const busy = reading || sending;
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
              onPick={onPick}
            />
            <PhotoPick
              label="Pilih gambar"
              className={shared.quiet}
              camera={false}
              disabled={busy}
              onPick={onPick}
            />
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
              onClick={onSend}
            >
              {sending ? "Mengirim…" : "Kirim presensi"}
            </button>
            <button
              type="button"
              className={shared.quiet}
              disabled={busy}
              onClick={onRedo}
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
