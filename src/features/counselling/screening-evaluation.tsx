import styles from "./counselling.module.css";
import { LevelBadges } from "./screening-badges";
import { checkScores, type SentScores } from "./screening-input";
import { screeningResult } from "./screening-rules";
import { SCALE_WORDS } from "./screening-words";

/*
 * The level and "Rekomendasi" as the scores are typed. Read by the form
 * in the browser, so nothing here may take from the database code.
 */

/** "Tingkat" with the doubled DASS-21 sums, and "Rekomendasi", or why there is none yet. */
export function ScreeningEvaluation({ sent }: { sent: SentScores }) {
  const scores = checkScores(sent);
  if (!scores.ok) {
    return (
      <p className={styles.warnBox} role="status">
        {scores.error}
      </p>
    );
  }
  const result = screeningResult(scores.value);
  const sums = result.scales
    .map((part) => `${SCALE_WORDS[part.scale]} ${part.score}`)
    .join(", ");
  return (
    <p className={styles.evaluation} role="status">
      Tingkat <LevelBadges level={result.level} risk={result.risk} />
      {sums !== "" && ` · ${sums}`}. Rekomendasi: <b>{result.advice}</b>.
    </p>
  );
}
