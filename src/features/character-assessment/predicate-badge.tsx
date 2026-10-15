import { predicateOf } from "@/character-scores/assessment-score";
import shared from "@/ui/data-screen.module.css";
import { PREDICATE_WORDS } from "./assessment-words";
import styles from "./character-assessment.module.css";

/** The predikat of a Rerata, with the dot of its colour. */
export function PredicateBadge({ rerata }: { rerata: number }) {
  const predicate = predicateOf(rerata);
  return (
    <span className={`${shared.badge} ${styles.predicate}`}>
      <i className={`${styles.dot} ${styles[predicate]}`} />
      {PREDICATE_WORDS[predicate]}
    </span>
  );
}
