import { predicateOf } from "@/character-scores/assessment-score";
import scoreStyles from "@/character-scores/character-scores.module.css";
import { PREDICATE_WORDS } from "@/character-scores/predicate-words";
import shared from "@/ui/data-screen.module.css";
import styles from "./dashboard.module.css";

/**
 * A score as `words` says it, with the dot of the predikat it would
 * have, named for a reader.
 */
export function ColouredScore({
  score,
  words,
}: {
  score: number;
  words: string;
}) {
  const predicate = predicateOf(score);
  return (
    <span className={styles.coloured}>
      <i className={`${scoreStyles.dot} ${scoreStyles[predicate]}`} />
      {words}
      <span className={shared.hidden}> ({PREDICATE_WORDS[predicate]})</span>
    </span>
  );
}
