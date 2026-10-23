import { EvaluationBadge } from "./evaluation-badge";
import { isComplete, readScores, type TypedScores } from "./evaluation-input";
import {
  evaluationAverage,
  evaluationResult,
  shownAverage,
} from "./evaluation-result";
import { POOR_RESULT_NOTE } from "./evaluation-words";
import styles from "./mentor-groups.module.css";

/**
 * "Nilai evaluasi": the average of the four values as they are typed, and
 * its result. Shown once every field holds a value of 0 to 100.
 */
export function EvaluationOutcome({ typed }: { typed: TypedScores }) {
  const scores = readScores(typed);
  if (!isComplete(scores)) {
    return (
      <p className={styles.outcome}>
        Isi keempat nilai dengan angka 0 sampai 100 untuk melihat nilai
        evaluasi.
      </p>
    );
  }
  const isPoor = evaluationResult(scores) === "poor";
  const average = evaluationAverage(scores);
  return (
    <p
      className={isPoor ? `${styles.outcome} ${styles.warned}` : styles.outcome}
      role="status"
    >
      Nilai evaluasi <b>{shownAverage(average)}</b>{" "}
      <EvaluationBadge average={average} />
      {isPoor && ` ${POOR_RESULT_NOTE}`}
    </p>
  );
}
