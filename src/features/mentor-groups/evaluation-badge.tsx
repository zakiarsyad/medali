import shared from "@/ui/data-screen.module.css";
import {
  type EvaluationResult,
  RESULT_TITLES,
  resultOf,
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

/**
 * The result of a Nilai evaluasi with the number, or "Belum dievaluasi"
 * where there is none.
 */
export function EvaluationBadge({ average }: { average: number | null }) {
  if (average === null) {
    return <span className={styles.quiet}>{NOT_EVALUATED}</span>;
  }
  return <Badge result={resultOf(average)} words={resultWords(average)} />;
}

/** A result alone, Baik, Cukup or Kurang, for a list that shows its average apart. */
export function ResultBadge({ result }: { result: EvaluationResult }) {
  return <Badge result={result} words={RESULT_TITLES[result]} />;
}
