"use client";

import { useState } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "@/ui/file-upload.module.css";
import { SAVE_AGAIN } from "@/ui/repeated-file";

/**
 * Whether "Simpan" is off: while saving, and while a file saved before
 * waits for its confirm to be ticked.
 */
export function isSaveOff(state: {
  saving: boolean;
  warned: boolean;
  confirmed: boolean;
}): boolean {
  if (state.saving) return true;
  return state.warned && !state.confirmed;
}

/**
 * "Simpan (n) baris" and "Batal" under a checked file. `warning` is the
 * note on a file saved before, or null; with one, "Simpan" waits for
 * "Tetap simpan berkas ini lagi" to be ticked.
 */
export function FileSaveButtons({
  ready,
  warning,
  saving,
  onSave,
  onCancel,
}: {
  ready: number;
  warning: string | null;
  saving: boolean;
  onSave: (confirmRepeat: boolean) => void;
  onCancel: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const warned = warning !== null;
  return (
    <>
      {warned && (
        <div>
          <p className={`${styles.fileResult} ${styles.fileWarn}`} role="alert">
            {warning}
          </p>
          <label className={shared.role}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            {SAVE_AGAIN}
          </label>
        </div>
      )}
      <button
        type="button"
        className={shared.button}
        disabled={isSaveOff({ saving, warned, confirmed })}
        onClick={() => onSave(warned && confirmed)}
      >
        {saving
          ? "Menyimpan…"
          : `Simpan ${ready.toLocaleString("id-ID")} baris`}
      </button>
      <button
        type="button"
        className={shared.quiet}
        disabled={saving}
        onClick={onCancel}
      >
        Batal
      </button>
    </>
  );
}
