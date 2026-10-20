import {
  PREDICATES,
  type Predicate,
} from "@/character-scores/assessment-score";
import { PREDICATE_WORDS } from "@/character-scores/predicate-words";
import styles from "./mentor-groups.module.css";

const FILL: Record<Predicate, string | undefined> = {
  gold: styles.barGold,
  silver: styles.barSilver,
  bronze: styles.barBronze,
  guidance: styles.barGuidance,
};

function describedBy(counts: Record<Predicate, number>): string {
  const each = PREDICATES.map(
    (predicate) => `${PREDICATE_WORDS[predicate]}: ${counts[predicate]}`,
  );
  return each.join(", ");
}

/**
 * How many assessed members hold each predikat, highest first, as one
 * bar where each predikat takes its share of the width.
 */
export function PredicateBar({
  counts,
}: {
  counts: Record<Predicate, number>;
}) {
  let total = 0;
  for (const predicate of PREDICATES) total += counts[predicate];
  let start = 0;
  const parts = PREDICATES.map((predicate) => {
    const part = { predicate, x: start, width: counts[predicate] };
    start += counts[predicate];
    return part;
  });
  return (
    <svg
      className={styles.predicateBar}
      viewBox={`0 0 ${Math.max(total, 1)} 1`}
      preserveAspectRatio="none"
      role="img"
    >
      <title>{describedBy(counts)}</title>
      {parts.map(({ predicate, x, width }) => (
        <rect
          key={predicate}
          className={FILL[predicate]}
          x={x}
          y={0}
          width={width}
          height={1}
        />
      ))}
    </svg>
  );
}
