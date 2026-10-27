import type { Scores } from "@/character-scores/assessment-score";
import { Medal } from "@/character-scores/medal";
import { JenjangBadge } from "@/discipline-penalties/jenjang-badge";
import { limitedScores, limits } from "@/discipline-penalties/score-limit";
import shared from "@/ui/data-screen.module.css";
import styles from "./discipline-penalties.module.css";
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
    <div className={lower ? notes.warnBox : notes.box}>
      <p className={styles.line}>{historyWords(history)}</p>
      {lower && (
        <p className={`${styles.line} ${styles.warning}`} role="alert">
          {LOWER_WARNING}
        </p>
      )}
    </div>
  );
}

/** The medal of the latest scores held at 70, over the one as stored. */
function CappedMedal({ latest }: { latest: Scores }) {
  return (
    <div className={styles.cappedMedal}>
      <Medal scores={limitedScores(latest, true)} last={latest} />
      <p className={styles.line}>
        Garis putus-putus menunjukkan skor sebelum pembatasan.
      </p>
    </div>
  );
}

/**
 * "Konsekuensi": the history of the student picked, with a warning when
 * the chosen Jenjang is lower than the highest before, and what the
 * chosen Jenjang means for the student: for Ringan and Sedang, what the
 * cap does to the Rerata of their latest assessment, with the medal
 * before and after. `history` is null while no student is picked or
 * theirs is being read.
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
  const latest = isPicked ? (history?.latest ?? null) : null;
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
        {consequencesOf(choice, latest).map((line) => (
          <div key={line.title}>
            <dt>{line.title}</dt>
            <dd>{line.text}</dd>
          </div>
        ))}
      </dl>
      {latest && limits(choice.category) && <CappedMedal latest={latest} />}
    </section>
  );
}
