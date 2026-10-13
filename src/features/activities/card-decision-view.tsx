import shared from "@/ui/data-screen.module.css";
import {
  OTHER_NOTE_MAX,
  OTHER_REASON,
  REJECTION_REASONS,
} from "./rejection-reasons";
import styles from "./verification.module.css";

/**
 * What a waiting card offers as it is drawn for one state: "Validasi",
 * and the reason of a rejection with "Tolak". Choosing a reason rejects
 * nothing yet: only "Tolak" does. "Lainnya" asks for a short note. While
 * a decision is on its way every press is switched off, so a second
 * press sends nothing more.
 */
export function CardDecisionView({
  name,
  reason,
  note,
  busy,
  onReason,
  onNote,
  onValidate,
  onReject,
}: {
  /** The name of the student, which tells the cards apart for a screen reader. */
  name: string;
  /** The reason chosen, or empty while none is. */
  reason: string;
  note: string;
  busy: boolean;
  onReason: (reason: string) => void;
  onNote: (note: string) => void;
  onValidate: () => void;
  onReject: () => void;
}) {
  return (
    <div className={styles.decide}>
      <button
        type="button"
        className={`${shared.button} ${styles.decideControl}`}
        disabled={busy}
        onClick={onValidate}
      >
        Validasi
      </button>
      <select
        className={`${shared.input} ${styles.decideControl}`}
        aria-label={`Alasan penolakan untuk ${name}`}
        value={reason}
        disabled={busy}
        onChange={(event) => onReason(event.target.value)}
      >
        <option value="">Pilih alasan penolakan…</option>
        {REJECTION_REASONS.map((each) => (
          <option key={each} value={each}>
            {each}
          </option>
        ))}
      </select>
      {reason === OTHER_REASON && (
        <input
          className={`${shared.input} ${styles.decideControl}`}
          aria-label={`Catatan alasan Lainnya untuk ${name}`}
          placeholder="Catatan singkat"
          maxLength={OTHER_NOTE_MAX}
          value={note}
          disabled={busy}
          onChange={(event) => onNote(event.target.value)}
        />
      )}
      <button
        type="button"
        className={`${shared.quiet} ${styles.decideControl}`}
        disabled={busy}
        onClick={onReject}
      >
        Tolak
      </button>
    </div>
  );
}
