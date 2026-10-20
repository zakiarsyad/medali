import shared from "@/ui/data-screen.module.css";
import { predicateOf } from "./assessment-score";
import styles from "./character-scores.module.css";
import { PREDICATE_WORDS } from "./predicate-words";

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
