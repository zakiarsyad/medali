import type { FormEvent } from "react";
import shared from "@/ui/data-screen.module.css";
import { DORM_CLARIFICATION_REASONS } from "./clarification-ids";
import { REASON_WORDS } from "./clarification-words";
import styles from "./leave.module.css";

/**
 * The kinds the file chooser offers; the server checks what is sent. A
 * phone offers its camera for a picture, beside its files.
 */
const TAKEN_KINDS = "application/pdf,image/jpeg,image/png";

/**
 * The form of a clarification of a dorm absence as it is drawn: Alasan,
 * Lampiran, Penjelasan, "Kirim klarifikasi" and "Batal", one column on a
 * phone. Its fields keep what the resident wrote and picked, also after
 * an answer that says something is wrong. While it is sent neither
 * button can be pressed, so a second press sends nothing more.
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
      <label className={`${shared.field} ${styles.field}`}>
        Alasan
        <select name="reason" className={shared.input}>
          {DORM_CLARIFICATION_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {REASON_WORDS[reason]}
            </option>
          ))}
        </select>
      </label>
      <label className={`${shared.field} ${styles.field}`}>
        Lampiran (PDF atau gambar, maks. 5 MB)
        <input
          type="file"
          name="file"
          accept={TAKEN_KINDS}
          className={shared.input}
        />
      </label>
      <label className={`${shared.field} ${styles.field} ${styles.full}`}>
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
