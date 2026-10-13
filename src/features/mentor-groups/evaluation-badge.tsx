import shared from "@/ui/data-screen.module.css";
import type { EvaluationScores } from "./evaluation-aspects";
import { type EvaluationResult, evaluationResult } from "./evaluation-result";
import { NOT_EVALUATED, resultWords } from "./evaluation-words";
import styles from "./mentor-groups.module.css";

const RESULT_STYLES: Record<EvaluationResult, string | undefined> = {
  good: styles.good,
  fair: styles.fair,
  poor: styles.poor,
};

/** A result with its average, or "Belum dievaluasi" where there is none. */
export function EvaluationBadge({
  scores,
}: {
  scores: EvaluationScores | null;
}) {
  if (scores === null) {
    return <span className={styles.quiet}>{NOT_EVALUATED}</span>;
  }
  const look = RESULT_STYLES[evaluationResult(scores)];
  return (
    <span className={`${shared.badge} ${look}`}>{resultWords(scores)}</span>
  );
}
