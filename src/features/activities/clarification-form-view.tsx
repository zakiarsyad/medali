import type { FormEvent } from "react";
import shared from "@/ui/data-screen.module.css";
import styles from "./activities.module.css";
import { CLARIFICATION_REASONS, REASON_WORDS } from "./clarification-reasons";

/** The kinds the file chooser offers; the server checks what is sent. */
const TAKEN_KINDS = "application/pdf,image/jpeg,image/png";

/**
 * The form of a clarification as it is drawn: Alasan, Lampiran,
 * Penjelasan, "Kirim klarifikasi" and "Batal". Its fields keep what the
 * student wrote and picked themselves, also after an answer that says
 * something is wrong. While it is sent neither button can be pressed, so
 * a second press sends nothing more.
 */
export function ClarificationFormView({
  sending,
  onSubmit,
  onCancel,
}: {
  sending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form className={shared.form} onSubmit={onSubmit} noValidate>
      <label className={`${shared.field} ${styles.fits}`}>
        Alasan
        <select name="reason" className={shared.input}>
          {CLARIFICATION_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {REASON_WORDS[reason]}
            </option>
          ))}
        </select>
      </label>
      <label className={`${shared.field} ${styles.fits}`}>
        Lampiran (PDF atau gambar, maks. 4 MB)
        <input
          type="file"
          name="file"
          accept={TAKEN_KINDS}
          className={shared.input}
        />
      </label>
      <label className={`${shared.field} ${styles.fits} ${styles.full}`}>
        Penjelasan
        <textarea
          name="explanation"
          rows={3}
          className={shared.input}
          placeholder="Jelaskan mengapa tidak tercatat hadir"
        />
      </label>
      <div className={`${shared.actions} ${styles.full}`}>
        <button type="submit" className={shared.button} disabled={sending}>
          {sending ? "Mengirim…" : "Kirim klarifikasi"}
        </button>
        <button
          type="button"
          className={shared.quiet}
          disabled={sending}
          onClick={onCancel}
        >
          Batal
        </button>
      </div>
    </form>
  );
}
