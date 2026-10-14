import shared from "@/ui/data-screen.module.css";
import {
  DECISION_KIND_WORDS,
  DECISION_KINDS,
  DECISION_NOTE_MAX,
  type DecisionKind,
} from "./clarification-decision";
import styles from "./verification.module.css";

/**
 * What a waiting clarification card offers as it is drawn for one state:
 * the Catatan and the three decisions. While a decision is on its way
 * everything is switched off, so a second press sends nothing more.
 */
export function ClarificationDecideView({
  name,
  note,
  busy,
  onNote,
  onDecide,
}: {
  /** The name of the student, which tells the cards apart for a screen reader. */
  name: string;
  note: string;
  busy: boolean;
  onNote: (note: string) => void;
  onDecide: (kind: DecisionKind) => void;
}) {
  return (
    <div className={styles.decide}>
      <input
        className={`${shared.input} ${styles.decideControl}`}
        aria-label={`Catatan untuk klarifikasi ${name}`}
        placeholder="Catatan (wajib bila ditolak)"
        maxLength={DECISION_NOTE_MAX}
        value={note}
        disabled={busy}
        onChange={(event) => onNote(event.target.value)}
      />
      {DECISION_KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          className={`${kind === "present" ? shared.button : shared.quiet} ${styles.decideControl}`}
          disabled={busy}
          onClick={() => onDecide(kind)}
        >
          {DECISION_KIND_WORDS[kind]}
        </button>
      ))}
    </div>
  );
}
