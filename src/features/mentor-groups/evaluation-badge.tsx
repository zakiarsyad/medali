import type { BadgeTone } from "@/ui/badge-tone";
import { toneBadge } from "@/ui/tone-badge";
import {
  type EvaluationResult,
  RESULT_TITLES,
  resultOf,
} from "./evaluation-result";
import { NOT_EVALUATED, resultWords } from "./evaluation-words";
import styles from "./mentor-groups.module.css";

const RESULT_TONES: Record<EvaluationResult, BadgeTone> = {
  good: "good",
  fair: "warning",
  poor: "bad",
};

function Badge({ result, words }: { result: EvaluationResult; words: string }) {
  return <span className={toneBadge(RESULT_TONES[result])}>{words}</span>;
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
