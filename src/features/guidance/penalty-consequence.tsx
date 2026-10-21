import shared from "@/ui/data-screen.module.css";
import styles from "./discipline-penalties.module.css";
import { JenjangBadge } from "./penalty-badges";
import {
  type ConsequenceChoice,
  consequencesOf,
  historyWords,
  isLowerThanBefore,
  LOWER_WARNING,
  type PenaltyHistory,
} from "./penalty-consequences";
import notes from "./violation-notes.module.css";

/*
 * Read by the form in the browser, so nothing here may take from the
 * database code.
 */

export const PICK_A_STUDENT =
  "Pilih mahasiswa untuk melihat riwayat pelanggarannya.";

/** How many penalties the student has, the highest, and the warning for a lower Jenjang. */
function HistoryBox({
  history,
  choice,
}: {
  history: PenaltyHistory;
  choice: ConsequenceChoice;
}) {
  const lower = isLowerThanBefore(choice.category, choice.level, history.top);
  return (
    <div className={`${notes.box} ${lower ? notes.warnBox : ""}`}>
      <p className={styles.line}>{historyWords(history)}</p>
      {lower && (
        <p className={`${styles.line} ${styles.warning}`} role="alert">
          {LOWER_WARNING}
        </p>
      )}
    </div>
  );
}

/**
 * "Konsekuensi": the history of the student picked, with a warning when
 * the chosen Jenjang is lower than the highest before, and what the
 * chosen Jenjang means for the student. `history` is null while no
 * student is picked or theirs is being read.
 */
export function PenaltyConsequence({
  choice,
  isPicked,
  history,
}: {
  choice: ConsequenceChoice;
  isPicked: boolean;
  history: PenaltyHistory | null;
}) {
  return (
    <section className={shared.panel}>
      <div className={styles.head}>
        <h2 className={shared.heading}>Konsekuensi</h2>
        <JenjangBadge category={choice.category} level={choice.level} />
      </div>
      {!isPicked && <p className={notes.box}>{PICK_A_STUDENT}</p>}
      {isPicked && history !== null && (
        <HistoryBox history={history} choice={choice} />
      )}
      <dl className={styles.consequences}>
        {consequencesOf(choice).map((line) => (
          <div key={line.title}>
            <dt>{line.title}</dt>
            <dd>{line.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
