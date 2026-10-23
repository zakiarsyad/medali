import shared from "@/ui/data-screen.module.css";
import type { EvaluationScores } from "./evaluation-aspects";
import {
  type EvaluationResult,
  evaluationResult,
  RESULT_TITLES,
} from "./evaluation-result";
import { NOT_EVALUATED, resultWords } from "./evaluation-words";
import styles from "./mentor-groups.module.css";

const RESULT_STYLES: Record<EvaluationResult, string | undefined> = {
  good: styles.good,
  fair: styles.fair,
  poor: styles.poor,
};

function Badge({ result, words }: { result: EvaluationResult; words: string }) {
  return (
    <span className={`${shared.badge} ${RESULT_STYLES[result]}`}>{words}</span>
  );
}

/** A result with its average, or "Belum dievaluasi" where there is none. */
export function EvaluationBadge({
  scores,
}: {
  scores: EvaluationScores | null;
}) {
  if (scores === null) {
    return <span className={styles.quiet}>{NOT_EVALUATED}</span>;
  }
  return (
    <Badge result={evaluationResult(scores)} words={resultWords(scores)} />
  );
}

/** A result alone, Baik, Cukup or Kurang, for a list that shows its average apart. */
export function ResultBadge({ result }: { result: EvaluationResult }) {
  return <Badge result={result} words={RESULT_TITLES[result]} />;
}
